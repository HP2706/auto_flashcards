#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dns = require('node:dns')
// Prefer IPv4 to avoid IPv6/DNS issues on some networks
if (typeof dns.setDefaultResultOrder === 'function') {
  try { dns.setDefaultResultOrder('ipv4first') } catch {}
}
const fs = require('node:fs')
const path = require('node:path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_* in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse CLI args for target user
const DEFAULT_USER_ID = 'e0c93724-e737-40fc-bfc7-7ca63e0ca9ce'
const argv = process.argv.slice(2)
function getArg(name) {
  const p = `--${name}=`
  const hit = argv.find(a => a.startsWith(p))
  return hit ? hit.slice(p.length) : undefined
}
const TARGET_USER_ID = getArg('user') || process.env.MIGRATE_USER_ID || DEFAULT_USER_ID
console.log(`[migrate] Target user: ${TARGET_USER_ID}`)

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function withRetry(fn, { tries = 3, baseDelay = 300 } = {}) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try { return await fn() } catch (e) {
      lastErr = e
      await sleep(baseDelay * Math.pow(2, i))
    }
  }
  throw lastErr
}

// Migration functions from existing code
function extractSection(md, header) {
  const regex = new RegExp(
    String.raw`^##\s*${header}\s*\r?\n([\s\S]*?)(?=\r?\n##\s|(?![\s\S]))`,
    "m"
  );
  const m = md.match(regex);
  return m ? m[1].trim() : undefined;
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (st.isFile() && entry.toLowerCase().endsWith(".md")) out.push(p);
  }
  return out;
}

function parseCardFromFile(filePath, cardsDir) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    const front = extractSection(raw, "Front") ?? "";
    const back = extractSection(raw, "Back") ?? "";
    // Use path relative to cardsDir to avoid basename collisions.
    // Replace separators to keep IDs safe for URL params (no slashes in Next.js [id]).
    const relPath = path.relative(cardsDir, filePath);
    const id = relPath.split(path.sep).join('__');
    const rel = path.relative(cardsDir, path.dirname(filePath));
    const group = rel && rel !== "." ? rel.split(path.sep)[0] : undefined;
    return { id, title, front, back, group };
  } catch (e) {
    console.error("Failed to parse card", filePath, e);
    return null;
  }
}

async function migrateCards() {
  console.log('Migrating flashcards...')
  
  // Find cards directory
  const inSite = path.resolve(process.cwd(), "markdown_cards");
  const cardsDir = fs.existsSync(inSite) ? inSite : path.resolve(process.cwd(), "..", "markdown_cards");
  
  if (!fs.existsSync(cardsDir)) {
    console.error('Cards directory not found')
    return
  }
  
  const files = walk(cardsDir)
  const cards = files
    .map(file => parseCardFromFile(file, cardsDir))
    // Keep cards even if Front/Back are empty strings to avoid drops
    .filter(card => !!card)
  
  console.log(`Found ${cards.length} cards to migrate`)
  
  const rows = cards.map(c => ({
    id: c.id,
    title: c.title || null,
    front: c.front,
    back: c.back,
    group: c.group || null,
    // Attach to a specific user for RLS policies
    ...(TARGET_USER_ID ? { user_id: TARGET_USER_ID } : {}),
  }))
  const chunkSize = 200
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    try {
      const { error, count } = await withRetry(() =>
        supabase
          .from('cards')
          .upsert(chunk)
          .select('id', { count: 'exact', head: false })
      )
      if (error) {
        console.error(`✗ Failed upsert chunk ${i + 1}-${Math.min(i + chunk.length, rows.length)}:`, error)
      } else {
        console.log(`✓ Upserted ${count ?? chunk.length} cards (${i + 1}-${Math.min(i + chunk.length, rows.length)})`)
      }
    } catch (e) {
      console.error(`✗ Failed upsert chunk ${i + 1}-${Math.min(i + chunk.length, rows.length)} with exception:`, e)
    }
  }
}

async function migrateHistory() {
  console.log('Migrating review history...')
  
  const historyPath = path.join(process.cwd(), 'data', 'history.json')
  
  if (!fs.existsSync(historyPath)) {
    console.log('No history file found, skipping history migration')
    return
  }
  
  try {
    const raw = fs.readFileSync(historyPath, 'utf-8')
    const history = JSON.parse(raw)
    
    console.log(`Found ${history.length} review logs to migrate`)
    
    // Filter logs to only those with existing cards
    const { data: ids, error: idsError } = await supabase.from('cards').select('id')
    if (idsError) {
      console.error('Failed to fetch card ids for history filtering:', idsError)
    }
    const valid = new Set((ids || []).map(r => r.id))

    const rows = history
      .filter(log => valid.has(log.cardId))
      .map(log => ({
        card_id: log.cardId,
        ts: log.ts,
        grade: log.grade,
        duration_ms: log.durationMs || null,
        ...(TARGET_USER_ID ? { user_id: TARGET_USER_ID } : {}),
      }))
    const chunkSize = 500
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      try {
        const { error, count } = await withRetry(() =>
          supabase
            .from('review_logs')
            .insert(chunk)
            .select('id', { count: 'exact', head: false })
        )
        if (error) {
          console.error(`✗ Failed review_logs chunk ${i + 1}-${Math.min(i + chunk.length, rows.length)}:`, error)
        } else {
          console.log(`✓ Inserted ${count ?? chunk.length} review logs (${i + 1}-${Math.min(i + chunk.length, rows.length)})`)
        }
      } catch (e) {
        console.error(`✗ Failed review_logs chunk ${i + 1}-${Math.min(i + chunk.length, rows.length)} with exception:`, e)
      }
    }
  } catch (e) {
    console.error('Failed to read history file:', e)
  }
}

async function wipeTablesIfRequested() {
  const args = new Set(process.argv.slice(2));
  const shouldWipe = args.has('--wipe') || process.env.WIPE === '1';
  if (!shouldWipe) return false;
  console.warn('WIPE requested: deleting all rows from review_logs and cards');
  try {
    // Delete history first due to FK dependencies
    let res = await supabase
      .from('review_logs')
      .delete()
      .neq('id', '');
    if (res.error) console.error('Failed to wipe review_logs:', res.error);

    res = await supabase
      .from('cards')
      .delete()
      .neq('id', '');
    if (res.error) console.error('Failed to wipe cards:', res.error);

    console.log('WIPE completed');
    return true;
  } catch (e) {
    console.error('WIPE failed:', e);
    return false;
  }
}

async function main() {
  console.log('Starting migration to Supabase...')
  
  try {
    await wipeTablesIfRequested()
    await migrateCards()
    await migrateHistory()
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()

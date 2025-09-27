import { NextRequest } from "next/server";
import { listCardFiles, parseCardFromFile } from "@/lib/cards";
import { supabase } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    console.log('Starting migration...')
    
    // Migrate cards
    console.log('Migrating flashcards...')
    const files = listCardFiles()
    const cards = files
      .map(file => parseCardFromFile(file))
      .filter(card => card && card.front && card.back)
    
    console.log(`Found ${cards.length} cards to migrate`)
    
    // Batch upsert cards to reduce network calls
    const rows = cards.map((c) => ({
      id: c!.id,
      title: c!.title || null,
      front: c!.front,
      back: c!.back,
      group: c!.group || null,
      updated_at: new Date().toISOString(),
    }))

    const chunkSize = 100
    let cardsMigrated = 0
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const { error, count } = await supabase
        .from('cards')
        .upsert(chunk)
        .select('id', { count: 'exact', head: false })
      if (error) {
        console.error('✗ Failed to upsert card chunk:', { index: i, size: chunk.length, error })
      } else {
        cardsMigrated += count || chunk.length
        console.log(`✓ Upserted cards ${i + 1}-${Math.min(i + chunk.length, rows.length)} (count=${count ?? chunk.length})`)
      }
    }
    
    // Migrate history
    console.log('Migrating review history...')
    const historyPath = path.join(process.cwd(), 'data', 'history.json')
    let history: any[] = []
    let historyMigrated = 0
    
    if (fs.existsSync(historyPath)) {
      try {
        const raw = fs.readFileSync(historyPath, 'utf-8')
        history = JSON.parse(raw) || []
        console.log(`Found ${history.length} review logs to migrate`)
        
        // Batch insert logs
        // Only keep logs for cards that exist
        const { data: existingCards, error: fetchIdsError } = await supabase
          .from('cards')
          .select('id')
        if (fetchIdsError) {
          console.error('✗ Failed to fetch existing card ids for history filtering:', fetchIdsError)
        }
        const validIds = new Set((existingCards || []).map((r: any) => r.id))
        const logRows = history.map((log: any) => ({
          card_id: log.cardId,
          ts: log.ts,
          grade: log.grade,
          duration_ms: log.durationMs || null,
        }))
        const filtered = logRows.filter((r: any) => validIds.has(r.card_id))
        const skipped = logRows.length - filtered.length
        if (skipped > 0) {
          console.log(`Skipping ${skipped} history rows with missing card_id`)
        }
        for (let i = 0; i < filtered.length; i += chunkSize) {
          const chunk = filtered.slice(i, i + chunkSize)
          const { error, count } = await supabase
            .from('review_logs')
            .insert(chunk)
            .select('id', { count: 'exact', head: false })
          if (error) {
            console.error('✗ Failed to insert history chunk:', { index: i, size: chunk.length, error })
          } else {
            historyMigrated += count || chunk.length
            console.log(`✓ Inserted history ${i + 1}-${Math.min(i + chunk.length, filtered.length)} (count=${count ?? chunk.length})`)
          }
        }
      } catch (e) {
        console.error('Failed to read/migrate history:', e)
      }
    } else {
      console.log('No history file found')
    }
    
    return Response.json({
      success: true,
      cardsMigrated,
      totalCards: cards.length,
      historyMigrated,
      totalHistory: history.length
    })
    
  } catch (error: any) {
    console.error('Migration failed:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

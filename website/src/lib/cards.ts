import { Card } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

// Prefer cards under website/markdown_cards; fallback to repo root ../markdown_cards
const CARDS_DIR = (() => {
  const inSite = path.resolve(process.cwd(), "markdown_cards");
  if (fs.existsSync(inSite)) return inSite;
  return path.resolve(process.cwd(), "..", "markdown_cards");
})();

function extractSection(md: string, header: string): string | undefined {
  // Capture text after a header line like `## Header` (allow extra spaces),
  // up to the next header line starting with `##` or end-of-file.
  // Important: with /m, `$` matches end-of-line, not end-of-string.
  // To stop at end-of-string, use the (?![\s\S]) sentinel instead of `$`.
  const regex = new RegExp(
    String.raw`^##\s*${header}\s*\r?\n([\s\S]*?)(?=\r?\n##\s|(?![\s\S]))`,
    "m"
  );

  if (process.env.DEBUG_CARDS === '1') {
    console.log("markdown", md);
  }
  const m = md.match(regex);
  const out = m ? m[1].trim() : undefined;
  if (process.env.DEBUG_CARDS === '1') {
    console.log(
      `[cards.extract] header=${header} matched=${!!m} len=${out?.length ?? 0} preview=${JSON.stringify((out ?? '').slice(0, 120))}`
    );
  }
  return out;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (st.isFile() && entry.toLowerCase().endsWith(".md")) out.push(p);
  }
  return out;
}

export function listCardFiles(): string[] {
  return walk(CARDS_DIR);
}

export function parseCardFromFile(filePath: string): Card | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    const front = extractSection(raw, "Front") ?? "";
    const back = extractSection(raw, "Back") ?? "";
    const id = path.basename(filePath);
    const rel = path.relative(CARDS_DIR, path.dirname(filePath));
    const group = rel && rel !== "." ? rel.split(path.sep)[0] : undefined;
    if (process.env.DEBUG_CARDS === '1') {
      console.log(
        `[cards.parse] file=${id} title=${JSON.stringify(title ?? '')} group=${group ?? ''} frontLen=${front.length} backLen=${back.length}`
      );
    }
    return { id, title, front, back, path: filePath, group };
  } catch (e) {
    console.error("Failed to parse card", filePath, e);
    return null;
  }
}

export function loadAllCards(): Card[] {
  return listCardFiles()
    .map(parseCardFromFile)
    .filter((c): c is Card => !!c && !!c.front && !!c.back);
}

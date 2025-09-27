// Re-export from the new DB module for backward compatibility
export { loadAllCards, saveCard, deleteCard } from '@/lib/db/cards'

// Legacy functions for migration only - will be removed
import { Card } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

const CARDS_DIR = (() => {
  const inSite = path.resolve(process.cwd(), "markdown_cards");
  if (fs.existsSync(inSite)) return inSite;
  return path.resolve(process.cwd(), "..", "markdown_cards");
})();

function extractSection(md: string, header: string): string | undefined {
  const regex = new RegExp(
    String.raw`^##\s*${header}\s*\r?\n([\s\S]*?)(?=\r?\n##\s|(?![\s\S]))`,
    "m"
  );
  const m = md.match(regex);
  return m ? m[1].trim() : undefined;
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
    return { id, title, front, back, path: filePath, group };
  } catch (e) {
    console.error("Failed to parse card", filePath, e);
    return null;
  }
}

import { NextRequest } from "next/server";
import { loadAllCards } from "@/lib/cards";
import fs from "node:fs";
import path from "node:path";
import { listCardFiles, parseCardFromFile } from "@/lib/cards";

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const group = url.searchParams.get("group");
  const cards = loadAllCards().filter((c) => (group ? c.group === group : true));
  const groups = Array.from(new Set(loadAllCards().map((c) => c.group).filter(Boolean)));
  return Response.json({ cards, groups });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, front, back, group } = body as { title?: string; front?: string; back?: string; group?: string };
    if (typeof front !== "string" || typeof back !== "string") {
      return new Response("Invalid body", { status: 400 });
    }
    const cardsRoot = (() => {
      const dir = path.resolve(process.cwd(), "markdown_cards");
      if (fs.existsSync(dir)) return dir;
      return path.resolve(process.cwd(), "..", "markdown_cards");
    })();
    const dir = group ? path.join(cardsRoot, group) : cardsRoot;
    fs.mkdirSync(dir, { recursive: true });

    const nameFromTitle = (t: string) => (t || "").toLowerCase()
      .replace(/[^a-z0-9\-_\s]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80) || "card";
    const slug = nameFromTitle(title || front.split("\n")[0]);
    let base = slug;
    let idx = 0;
    let filePath = path.join(dir, `${base}.md`);
    while (fs.existsSync(filePath)) {
      idx += 1;
      filePath = path.join(dir, `${base}_${idx}.md`);
    }

    const fileTitle = title && title.trim() ? title.trim() : (front.split("\n")[0] || "New Card");
    const contents = `# ${fileTitle}\n\n## Front\n${front.trim()}\n\n## Back\n${back.trim()}\n`;
    fs.writeFileSync(filePath, contents, "utf-8");

    const card = parseCardFromFile(filePath);
    return Response.json({ ok: true, card });
  } catch (e) {
    return new Response("Failed to create", { status: 500 });
  }
}

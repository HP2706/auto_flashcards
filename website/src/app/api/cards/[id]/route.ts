import { NextRequest } from "next/server";
import { loadAllCards, parseCardFromFile } from "@/lib/cards";
import fs from "node:fs";

export function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  const cards = loadAllCards();
  const card = cards.find((c) => c.id === id);
  if (!card) return new Response("Not found", { status: 404 });
  return Response.json({ card });
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const cards = loadAllCards();
    const card = cards.find((c) => c.id === id);
    if (!card) return new Response("Not found", { status: 404 });

    const body = await req.json();
    const { title, front, back } = body as { title?: string; front: string; back: string };
    if (typeof front !== "string" || typeof back !== "string") {
      return new Response("Invalid body", { status: 400 });
    }

    const newTitle = (title ?? card.title ?? card.id).toString();
    const contents = `# ${newTitle}\n\n## Front\n${front.trim()}\n\n## Back\n${back.trim()}\n`;
    fs.writeFileSync(card.path, contents, "utf-8");

    const updated = parseCardFromFile(card.path);
    return Response.json({ ok: true, card: updated });
  } catch (e) {
    return new Response("Failed to save", { status: 500 });
  }
}

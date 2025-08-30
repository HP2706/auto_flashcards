import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body as { name?: string };
    const group = (name || "").trim();
    if (!group) return new Response("Invalid name", { status: 400 });

    const cardsRoot = (() => {
      const dir = path.resolve(process.cwd(), "markdown_cards");
      if (fs.existsSync(dir)) return dir;
      return path.resolve(process.cwd(), "..", "markdown_cards");
    })();
    const dir = path.join(cardsRoot, group);
    fs.mkdirSync(dir, { recursive: true });
    return Response.json({ ok: true, group });
  } catch (e) {
    return new Response("Failed to create group", { status: 500 });
  }
}


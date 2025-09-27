import { NextRequest } from "next/server";
import { loadAllCards, saveCard } from "@/lib/cards";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const group = url.searchParams.get("group");
    const auth = req.headers.get('authorization') || undefined;
    const db = createServerSupabase(auth);
    const cards = await loadAllCards(db);
    const filteredCards = cards.filter((c) => (group ? c.group === group : true));
    const groups = Array.from(new Set(cards.map((c) => c.group).filter(Boolean)));
    return Response.json({ cards: filteredCards, groups });
  } catch (error) {
    console.error('Failed to load cards:', error);
    return new Response("Failed to load cards", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, front, back, group } = body as { title?: string; front?: string; back?: string; group?: string };
    if (typeof front !== "string" || typeof back !== "string") {
      return new Response("Invalid body", { status: 400 });
    }

    // Generate unique ID
    const nameFromTitle = (t: string) => (t || "").toLowerCase()
      .replace(/[^a-z0-9\-_\s]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 80) || "card";
    const slug = nameFromTitle(title || front.split("\n")[0]);
    const id = `${slug}_${Date.now()}.md`;

    const card = {
      id,
      title: title?.trim() || (front.split("\n")[0] || "New Card"),
      front: front.trim(),
      back: back.trim(),
      group: group?.trim() || undefined
    };

    const auth = req.headers.get('authorization') || undefined;
    const db = createServerSupabase(auth);
    const success = await saveCard(card, db);
    if (!success) {
      return new Response("Failed to save card", { status: 500 });
    }

    return Response.json({ ok: true, card });
  } catch (e) {
    console.error('Failed to create card:', e);
    return new Response("Failed to create", { status: 500 });
  }
}

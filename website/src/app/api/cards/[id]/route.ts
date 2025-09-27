import { NextRequest } from "next/server";
import { loadAllCards, saveCard, deleteCard } from "@/lib/cards";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const auth = req.headers.get('authorization') || undefined;
    const db = createServerSupabase(auth);
    const cards = await loadAllCards(db);
    const card = cards.find((c) => c.id === id);
    if (!card) return new Response("Not found", { status: 404 });
    return Response.json({ card });
  } catch (error) {
    console.error('Failed to get card:', error);
    return new Response("Failed to get card", { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const auth = req.headers.get('authorization') || undefined;
    const db = createServerSupabase(auth);
    const cards = await loadAllCards(db);
    const card = cards.find((c) => c.id === id);
    if (!card) return new Response("Not found", { status: 404 });

    const body = await req.json();
    const { title, front, back } = body as { title?: string; front: string; back: string };
    if (typeof front !== "string" || typeof back !== "string") {
      return new Response("Invalid body", { status: 400 });
    }

    const updatedCard = {
      ...card,
      title: title?.trim() || card.title,
      front: front.trim(),
      back: back.trim(),
    };

    const success = await saveCard(updatedCard, db);
    if (!success) {
      return new Response("Failed to save card", { status: 500 });
    }

    return Response.json({ ok: true, card: updatedCard });
  } catch (e) {
    console.error('Failed to save card:', e);
    return new Response("Failed to save", { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;
    const auth = req.headers.get('authorization') || undefined;
    const db = createServerSupabase(auth);
    const cards = await loadAllCards(db);
    const card = cards.find((c) => c.id === id);
    if (!card) return new Response("Not found", { status: 404 });
    
    const success = await deleteCard(id, db);
    if (!success) {
      return new Response("Failed to delete card", { status: 500 });
    }
    
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete card:', e);
    return new Response("Failed to delete", { status: 500 });
  }
}

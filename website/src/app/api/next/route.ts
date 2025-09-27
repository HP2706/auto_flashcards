import { NextRequest } from "next/server";
import { loadAllCards } from "@/lib/cards";
import { getAlgorithm } from "@/algorithms";
import { buildAggregates, readHistory } from "@/lib/history";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Number(searchParams.get("count") ?? "10");
    const algoKey = searchParams.get("algo") ?? undefined;
    const group = searchParams.get("group");

    const allCards = await loadAllCards();
    const cards = allCards.filter((c) => (group ? c.group === group : true));
    const history = await readHistory();
    const aggregates = buildAggregates(history);
    const now = Date.now();
    const scheduler = getAlgorithm(algoKey ?? undefined);
    const ids = scheduler.pickNext(count, { now, cards, history, aggregates });
    const selected = ids
      .map((id) => cards.find((c) => c.id === id))
      .filter(Boolean);

    return Response.json({ ids, cards: selected });
  } catch (e: any) {
    console.error('Failed to compute next cards:', e);
    // Return JSON even on error so the client can parse safely
    return Response.json({ ids: [], cards: [], error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

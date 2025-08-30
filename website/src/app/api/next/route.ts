import { NextRequest } from "next/server";
import { loadAllCards } from "@/lib/cards";
import { getAlgorithm } from "@/algorithms";
import { buildAggregates, readHistory } from "@/lib/history";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = Number(searchParams.get("count") ?? "10");
  const algoKey = searchParams.get("algo") ?? undefined;
  const group = searchParams.get("group");

  const cards = loadAllCards().filter((c) => (group ? c.group === group : true));
  const history = readHistory();
  const aggregates = buildAggregates(history);
  const now = Date.now();
  const scheduler = getAlgorithm(algoKey ?? undefined);
  const ids = scheduler.pickNext(count, { now, cards, history, aggregates });
  const selected = ids
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean);

  return Response.json({ ids, cards: selected });
}

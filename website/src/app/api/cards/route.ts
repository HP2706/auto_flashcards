import { NextRequest } from "next/server";
import { loadAllCards } from "@/lib/cards";

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const group = url.searchParams.get("group");
  const cards = loadAllCards().filter((c) => (group ? c.group === group : true));
  const groups = Array.from(new Set(loadAllCards().map((c) => c.group).filter(Boolean)));
  return Response.json({ cards, groups });
}

import { NextRequest } from "next/server";
import { appendHistory } from "@/lib/history";
import { ReviewGrade } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, grade, durationMs } = body as { cardId: string; grade: ReviewGrade; durationMs?: number };
    if (!cardId || !grade) return new Response("Missing cardId/grade", { status: 400 });
    const log = { cardId, grade, durationMs, ts: Date.now() };
    appendHistory(log);
    return Response.json({ ok: true });
  } catch (e) {
    return new Response("Bad request", { status: 400 });
  }
}

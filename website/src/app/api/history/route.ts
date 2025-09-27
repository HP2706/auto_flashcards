import { NextRequest } from "next/server";
import { readHistory } from "@/lib/history";
import { createServerSupabase } from "@/lib/supabase";
import { loadAllCards } from "@/lib/cards";
import { ReviewLog } from "@/lib/types";

async function makeFakeHistory(): Promise<ReviewLog[]> {
  const cards = await loadAllCards();
  const now = Date.now();
  const out: ReviewLog[] = [];
  let t = now - 1000 * 60 * 60 * 24 * 30; // 30 days ago
  for (const c of cards) {
    const n = 5 + Math.floor(Math.random() * 15);
    let delta = 1000 * 60 * 60 * (6 + Math.random() * 24);
    for (let i = 0; i < n; i++) {
      t += delta * (0.6 + Math.random());
      const g = ["again", "hard", "good", "easy"][Math.floor(Math.random() * 4)] as ReviewLog["grade"];
      out.push({ cardId: c.id, ts: t, grade: "view" });
      out.push({ cardId: c.id, ts: t + 10_000, grade: g });
      delta *= 1.2;
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fake = url.searchParams.get("fake") === "1";
  const auth = req.headers.get('authorization') || undefined;
  const db = createServerSupabase(auth);
  const logs = fake ? await makeFakeHistory() : await readHistory(db);
  return Response.json({ history: logs });
}

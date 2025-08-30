import fs from "node:fs";
import path from "node:path";
import { CardAggregate, ReviewGrade, ReviewLog } from "@/lib/types";

// Store app data under website/data
const DATA_DIR = path.resolve(process.cwd(), "data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_PATH)) fs.writeFileSync(HISTORY_PATH, "[]\n");
}

export function readHistory(): ReviewLog[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    const arr = JSON.parse(raw) as ReviewLog[];
    return arr;
  } catch (e) {
    console.error("Failed to read history", e);
    return [];
  }
}

export function appendHistory(log: ReviewLog) {
  ensureDataDir();
  const current = readHistory();
  current.push(log);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(current, null, 2));
}

export function gradeToDelta(grade: ReviewGrade): number {
  switch (grade) {
    case "again":
      return -0.3;
    case "hard":
      return -0.05;
    case "good":
      return 0.0;
    case "easy":
      return 0.15;
    case "view":
      return 0.0;
  }
}

export function buildAggregates(history: ReviewLog[]): Record<string, CardAggregate> {
  const map: Record<string, CardAggregate> = {};
  for (const h of history) {
    const agg = (map[h.cardId] ||= {
      cardId: h.cardId,
      reviews: 0,
      ease: 2.5,
      intervalDays: 0,
    });
    if (h.grade !== "view") {
      agg.reviews += 1;
    }
    agg.lastReviewed = h.ts;
  }
  return map;
}

export type GroupSummary = {
  group: string;
  reviews: number;
  views: number;
};

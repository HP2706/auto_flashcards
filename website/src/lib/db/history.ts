import { supabase } from '@/lib/supabase'
import { ReviewLog, CardAggregate } from '@/lib/types'

export async function readHistory(): Promise<ReviewLog[]> {
  const { data, error } = await supabase
    .from('review_logs')
    .select('*')
    .order('ts')
  
  if (error) {
    console.error('Failed to read history:', error)
    return []
  }
  
  return data.map(row => ({
    cardId: row.card_id,
    ts: row.ts,
    grade: row.grade as ReviewLog['grade'],
    durationMs: row.duration_ms || undefined
  }))
}

export async function appendHistory(log: ReviewLog): Promise<boolean> {
  const { error } = await supabase
    .from('review_logs')
    .insert({
      card_id: log.cardId,
      ts: log.ts,
      grade: log.grade,
      duration_ms: log.durationMs || null
    })
  
  if (error) {
    console.error('Failed to append history:', error)
    return false
  }
  
  return true
}

export function gradeToDelta(grade: ReviewLog['grade']): number {
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

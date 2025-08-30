import { Card, CardAggregate, ReviewLog, Scheduler, SchedulerContext } from "@/lib/types";

function replay(cardId: string, logs: ReviewLog[], now: number): CardAggregate {
  let agg: CardAggregate = {
    cardId,
    reviews: 0,
    ease: 2.5,
    intervalDays: 0,
    due: now,
  };
  for (const log of logs) {
    agg.reviews += 1;
    agg.lastReviewed = log.ts;
    // Simple SM-2 style update
    switch (log.grade) {
      case "again": {
        agg.ease = Math.max(1.3, agg.ease - 0.2);
        agg.intervalDays = 0;
        agg.due = log.ts + 10 * 60 * 1000; // 10 minutes
        break;
      }
      case "hard": {
        agg.ease = Math.max(1.3, agg.ease - 0.05);
        const next = Math.max(1, Math.ceil(agg.intervalDays * 1.2));
        agg.intervalDays = next;
        agg.due = log.ts + next * 24 * 60 * 60 * 1000;
        break;
      }
      case "good": {
        const base = agg.intervalDays === 0 ? 1 : Math.ceil(agg.intervalDays * agg.ease);
        agg.intervalDays = Math.max(1, base);
        agg.due = log.ts + agg.intervalDays * 24 * 60 * 60 * 1000;
        break;
      }
      case "easy": {
        agg.ease = Math.min(3.5, agg.ease + 0.05);
        const growth = agg.intervalDays === 0 ? 3 : Math.ceil(agg.intervalDays * (agg.ease + 0.15));
        agg.intervalDays = Math.max(1, growth);
        agg.due = log.ts + agg.intervalDays * 24 * 60 * 60 * 1000;
        break;
      }
    }
  }
  return agg;
}

function byDue(a: CardAggregate, b: CardAggregate): number {
  const ad = a.due ?? 0;
  const bd = b.due ?? 0;
  return ad - bd;
}

const scheduler: Scheduler = {
  name: "default",
  description: "Simple SM-2-like: due-first, then new",
  pickNext: (count: number, ctx: SchedulerContext) => {
    const byId: Record<string, ReviewLog[]> = {};
    for (const h of ctx.history) {
      (byId[h.cardId] ||= []).push(h);
    }
    const now = ctx.now;
    const aggregates: Record<string, CardAggregate> = {};
    for (const c of ctx.cards) {
      const logs = byId[c.id] || [];
      aggregates[c.id] = replay(c.id, logs, now);
    }

    // Cards with any reviews, sorted by due, due first
    const seenCards = ctx.cards.filter((c) => (byId[c.id]?.length ?? 0) > 0);
    const newCards = ctx.cards.filter((c) => (byId[c.id]?.length ?? 0) === 0);
    seenCards.sort((a, b) => byDue(aggregates[a.id], aggregates[b.id]));

    const due = seenCards.filter((c) => (aggregates[c.id].due ?? now) <= now);
    const upcoming = seenCards.filter((c) => (aggregates[c.id].due ?? now) > now);

    const pick: string[] = [];
    for (const group of [due, newCards, upcoming]) {
      for (const c of group) {
        if (pick.length >= count) break;
        pick.push(c.id);
      }
      if (pick.length >= count) break;
    }
    return pick;
  },
};

export default scheduler;

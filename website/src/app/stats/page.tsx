"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart as BarChartX, TimeSeries as TimeSeriesX, GradeSeries } from "@/components/charts";
import { authedFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/RequireAuth";

type ReviewLog = { cardId: string; ts: number; grade: string; durationMs?: number };
type Card = { id: string; title?: string; group?: string };

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce((acc, x) => {
    const k = key(x);
    (acc[k] ||= [] as T[]).push(x);
    return acc;
  }, {} as Record<K, T[]>);
}

// Using shared chart components

export default function StatsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [history, setHistory] = useState<ReviewLog[]>([]);
  const [useFake, setUseFake] = useState(false);
  const [group, setGroup] = useState("");
  const [cardId, setCardId] = useState("");

  const groups = useMemo(() => Array.from(new Set(cards.map((c) => c.group).filter(Boolean))) as string[], [cards]);
  const visibleCards = useMemo(() => cards.filter((c) => (group ? c.group === group : true)), [cards, group]);

  const load = async () => {
    const [cardsRes, histRes] = await Promise.all([
      authedFetch(`/api/cards${group ? `?group=${encodeURIComponent(group)}` : ""}`),
      authedFetch(`/api/history${useFake ? "?fake=1" : ""}`),
    ]);
    const cardsData = await cardsRes.json();
    const histData = await histRes.json();
    setCards(cardsData.cards);
    setHistory(histData.history || []);
    if (!cardId && cardsData.cards.length) setCardId(cardsData.cards[0].id);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFake, group]);

  const byCardLogs = useMemo(() => groupBy(history, (h) => h.cardId), [history]);
  const byGroup = useMemo(() => {
    const out: Record<string, { reviews: number; views: number }> = {};
    for (const c of cards) {
      const logs = byCardLogs[c.id] || [];
      const r = logs.filter((l) => l.grade !== "view").length;
      const v = logs.filter((l) => l.grade === "view").length;
      const key = c.group || "default";
      out[key] = out[key] || { reviews: 0, views: 0 };
      out[key].reviews += r;
      out[key].views += v;
    }
    return out;
  }, [cards, byCardLogs]);

  const groupBars = useMemo(
    () => Object.entries(byGroup).map(([label, v]) => ({ label, value: v.reviews })),
    [byGroup]
  );

  const selLogs = useMemo(() => (byCardLogs[cardId] || []).sort((a, b) => a.ts - b.ts), [byCardLogs, cardId]);
  const series = useMemo(() => {
    const logs = selLogs.filter((l) => l.grade !== "view");
    let cnt = 0;
    return logs.map((l) => ({ x: l.ts, y: ++cnt }));
  }, [selLogs]);

  return (
    <RequireAuth>
      <main className="container">
      <div className="toolbar">
        <div className="controls" style={{ gap: 10 }}>
          <label className="label">
            <span>Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">All</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            <span>Card</span>
            <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {visibleCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.id}
                </option>
              ))}
            </select>
          </label>
          <label className="label" title="Use a generated dataset to debug visuals">
            <input type="checkbox" checked={useFake} onChange={(e) => setUseFake(e.target.checked)} /> Fake data
          </label>
        </div>
        <div className="status">History: {history.length}</div>
      </div>

      <h3>Reviews by Group</h3>
      <BarChartX data={groupBars} label="Reviews" />

      <h3 style={{ marginTop: 16 }}>Per-Card Review Count Over Time</h3>
      <TimeSeriesX points={series} events={selLogs.filter((l) => l.grade !== "view").map((l) => ({ x: l.ts, grade: l.grade }))} yLabel="Reviews" />

      <h3 style={{ marginTop: 16 }}>Per-Card Grade Over Time</h3>
      <GradeSeries events={selLogs.filter((l) => l.grade !== "view").map((l) => ({ x: l.ts, grade: l.grade }))} />
      </main>
    </RequireAuth>
  );
}

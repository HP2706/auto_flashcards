"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mdToHtml as renderMd } from "@/lib/markdown";
import { TimeSeries, GradeSeries } from "@/components/charts";

type Card = { id: string; title?: string; front: string; back: string };

type Algorithm = { key: string; name: string; description?: string };

export default function StudyPage() {
  const [algos, setAlgos] = useState<Algorithm[]>([]);
  const [algo, setAlgo] = useState<string>("default");
  const [queue, setQueue] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const startTs = useRef<number | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [group, setGroup] = useState<string>("");
  const lastViewedId = useRef<string | null>(null);
  const [hist, setHist] = useState<{ ts: number; grade: string }[]>([]);

  useEffect(() => {
    fetch("/api/algorithms").then(async (r) => {
      const data = await r.json();
      setAlgos(data.algorithms);
    });
  }, []);

  const loadNext = async (reset = false) => {
    const params = new URLSearchParams({ count: String(20), algo });
    if (group) params.set("group", group);
    const r = await fetch(`/api/next?${params.toString()}`);
    const data = await r.json();
    const list: Card[] = data.cards;
    if (reset) {
      setQueue(list);
      setCurrent(list[0] ?? null);
    } else {
      const newQ = [...queue, ...list];
      setQueue(newQ);
      if (!current) setCurrent(newQ[0] ?? null);
    }
  };

  useEffect(() => {
    // initial queue
    loadNext(true);
  }, [algo, group]);

  useEffect(() => {
    // fetch groups for filter
    fetch("/api/cards").then(async (r) => {
      const data = await r.json();
      setGroups(data.groups || []);
    });
  }, []);

  const onShowAnswer = () => {
    setShowBack(true);
    if (startTs.current == null) startTs.current = Date.now();
  };

  const onGrade = async (grade: "again" | "hard" | "good" | "easy") => {
    if (!current) return;
    const durationMs = startTs.current ? Date.now() - startTs.current : undefined;
    startTs.current = null;
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: current.id, grade, durationMs }),
    });
    const [, ...rest] = queue;
    setQueue(rest);
    setCurrent(rest[0] ?? null);
    setShowBack(false);
    if (rest.length < 5) loadNext();
  };

  const frontHtml = useMemo(() => (current ? renderMd(current.front) : ""), [current]);
  const backHtml = useMemo(() => (current ? renderMd(current.back) : ""), [current]);

  // Log a 'view' event whenever the current card changes, and load history for charts
  useEffect(() => {
    if (current && current.id !== lastViewedId.current) {
      lastViewedId.current = current.id;
      fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: current.id, grade: "view" }),
      }).catch(() => {});
      fetch(`/api/history`).then(async (r) => {
        const data = await r.json();
        const logs = (data.history || [])
          .filter((l: any) => l.cardId === current.id && l.grade !== "view")
          .sort((a: any, b: any) => a.ts - b.ts);
        setHist(logs.map((l: any) => ({ ts: l.ts, grade: l.grade })));
      });
    }
  }, [current?.id]);

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls">
          <label className="label">
            <span>Algorithm</span>
            <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
              {algos.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
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
          <a className="link" href="/cards">Browse Cards</a>
        </div>
        <div className="status">Queue: {queue.length}</div>
      </div>

      {!current ? (
        <div>No cards loaded.</div>
      ) : (
        <div>
          <div className="card">
            <div className="card-title">{current.title ?? current.id}</div>
            <div className="card-body" dangerouslySetInnerHTML={{ __html: showBack ? backHtml : frontHtml }} />
          </div>

          {!showBack ? (
            <div className="actions">
              <button className="primary" onClick={onShowAnswer}>Show Answer</button>
            </div>
          ) : (
            <div className="grade-row">
              <button className="again" onClick={() => onGrade("again")}>Again</button>
              <button className="hard" onClick={() => onGrade("hard")}>Hard</button>
              <button className="good" onClick={() => onGrade("good")}>Good</button>
              <button className="easy" onClick={() => onGrade("easy")}>Easy</button>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <h3>Performance</h3>
            <TimeSeries
              points={hist.map((l, i) => ({ x: l.ts, y: i + 1 }))}
              events={hist.map((l) => ({ x: l.ts, grade: l.grade }))}
              yLabel="Reviews"
            />
            <div style={{ height: 8 }} />
            <GradeSeries events={hist.map((l) => ({ x: l.ts, grade: l.grade }))} />
          </div>
        </div>
      )}
    </main>
  );
}

// mdToHtml implementation moved to @/lib/markdown

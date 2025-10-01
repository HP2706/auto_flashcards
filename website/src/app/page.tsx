"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { mdToHtml as renderMd } from "@/lib/markdown";
import { TimeSeries, GradeSeries } from "@/components/charts";
import RequireAuth from "@/components/RequireAuth";
import { authedFetch } from "@/lib/authFetch";

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
  const [showPerf, setShowPerf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  useEffect(() => {
    fetch("/api/algorithms").then(async (r) => {
      const data = await r.json();
      setAlgos(data.algorithms);
    });
  }, []);

  const loadNext = async (reset = false) => {
    const params = new URLSearchParams({ count: String(20), algo });
    if (group) params.set("group", group);
    const r = await authedFetch(`/api/next?${params.toString()}`);
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
    authedFetch("/api/cards").then(async (r) => {
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
    await authedFetch("/api/review", {
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

  const insertAtCursor = (el: HTMLTextAreaElement, text: string) => {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const next = `${before}${text}${after}`;
    const caret = start + text.length;
    return { next, caret };
  };

  async function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>, which: "front" | "back") {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.kind === "file") {
        const file = it.getAsFile();
        if (file && file.size > 0) {
          e.preventDefault();
          const fd = new FormData();
          fd.append("file", file, file.name || "pasted.png");
          const r = await fetch("/api/upload", { method: "POST", body: fd });
          if (r.ok) {
            const data = await r.json();
            const link = data.url || data.path; // prefer absolute URL from storage
            const md = data.isImage ? `![Image](${link})` : `[File](${link})`;
            const el = e.target as HTMLTextAreaElement;
            const { next, caret } = insertAtCursor(el, md);
            if (which === "front") setEditFront(next);
            else setEditBack(next);
            requestAnimationFrame(() => { try { el.selectionStart = el.selectionEnd = caret; } catch {} });
          }
          return;
        }
      }
    }
  }

  const onStartEdit = () => {
    if (!current) return;
    setEditTitle(current.title ?? current.id);
    setEditFront(current.front);
    setEditBack(current.back);
    setEditing(true);
  };

  const onSaveEdit = async () => {
    if (!current) return;
    const r = await fetch(`/api/cards/${encodeURIComponent(current.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, front: editFront, back: editBack }),
    });
    if (r.ok) {
      const data = await r.json();
      const updated = data.card as Card;
      setCurrent({ id: updated.id, title: updated.title, front: updated.front, back: updated.back });
      setEditing(false);
    }
  };

  // Log a 'view' event whenever the current card changes, and load history for charts
  useEffect(() => {
    if (current && current.id !== lastViewedId.current) {
      lastViewedId.current = current.id;
      authedFetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: current.id, grade: "view" }),
      }).catch(() => {});
      authedFetch(`/api/history`).then(async (r) => {
        const data = await r.json();
        const logs = (data.history || [])
          .filter((l: any) => l.cardId === current.id && l.grade !== "view")
          .sort((a: any, b: any) => a.ts - b.ts);
        setHist(logs.map((l: any) => ({ ts: l.ts, grade: l.grade })));
      });
    }
  }, [current?.id]);

  return (
    <RequireAuth>
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
            {!editing ? (
              <>
                <div className="card-title">{current.title ?? current.id}</div>
                <div className="card-body" dangerouslySetInnerHTML={{ __html: showBack ? backHtml : frontHtml }} />
                <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={onStartEdit}>Edit</button>
                  <button className="again" onClick={async () => {
                    if (!current) return;
                    if (!confirm(`Delete card ${current.id}?`)) return;
                    await authedFetch(`/api/cards/${encodeURIComponent(current.id)}`, { method: 'DELETE' });
                    const [, ...rest] = queue;
                    setQueue(rest);
                    setCurrent(rest[0] ?? null);
                    setShowBack(false);
                    if (rest.length < 5) loadNext();
                  }}>Delete</button>
                  <button onClick={() => setShowPerf((v) => !v)}>{showPerf ? 'Hide Performance' : 'View Performance'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="card-title">Edit: {current.id}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label" style={{ display: 'block', marginBottom: 6 }}>Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="search" style={{ width: '100%' }} />
                    <label className="label" style={{ display: 'block', marginTop: 10 }}>Front</label>
                    <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} onPaste={(e) => handlePaste(e, 'front')} style={{ width: '100%', height: 180 }} className="search" />
                    <label className="label" style={{ display: 'block', marginTop: 10 }}>Back</label>
                    <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} onPaste={(e) => handlePaste(e, 'back')} style={{ width: '100%', height: 180 }} className="search" />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => setEditing(false)}>Cancel</button>
                      <button className="primary" onClick={onSaveEdit}>Save</button>
                    </div>
                  </div>
                  <div>
                    <div className="card-title">Preview</div>
                    <div className="card-body" dangerouslySetInnerHTML={{ __html: renderMd(editFront) }} />
                    <hr style={{ borderColor: '#262c46', margin: '12px 0' }} />
                    <div className="card-body" dangerouslySetInnerHTML={{ __html: renderMd(editBack) }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {!editing && !showBack ? (
            <div className="actions">
              <button className="primary" onClick={onShowAnswer}>Show Answer</button>
            </div>
          ) : (!editing ? (
            <div className="grade-row">
              <button className="again" onClick={() => onGrade("again")}>Again</button>
              <button className="hard" onClick={() => onGrade("hard")}>Hard</button>
              <button className="good" onClick={() => onGrade("good")}>Good</button>
              <button className="easy" onClick={() => onGrade("easy")}>Easy</button>
            </div>
          ) : null)}
          {showPerf ? (
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
          ) : null}
        </div>
      )}
      </main>
    </RequireAuth>
  );
}

// mdToHtml implementation moved to @/lib/markdown

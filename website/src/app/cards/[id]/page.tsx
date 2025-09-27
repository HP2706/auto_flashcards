"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClipboardEvent } from "react";
import { mdToHtml } from "@/lib/markdown";
import { GradeSeries, TimeSeries } from "@/components/charts";

type Card = { id: string; title?: string; front: string; back: string; group?: string };

export default function CardDetail({ params }: { params: { id: string } }) {
  const [card, setCard] = useState<Card | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [history, setHistory] = useState<{ ts: number; grade: string }[]>([]);

  useEffect(() => {
    fetch(`/api/cards/${encodeURIComponent(params.id)}`).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setCard(data.card);
        setTitle(data.card?.title || data.card?.id || "");
        setFront(data.card?.front || "");
        setBack(data.card?.back || "");
      }
    });
    fetch(`/api/history`).then(async (r) => {
      const data = await r.json();
      const logs = (data.history || []).filter((l: any) => l.cardId === params.id && l.grade !== "view").sort((a: any, b: any) => a.ts - b.ts);
      setHistory(logs.map((l: any) => ({ ts: l.ts, grade: l.grade })));
    });
  }, [params.id]);

  // If opened with ?edit=1, enter edit mode directly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      if (q.get('edit') === '1') setEditing(true);
    }
  }, []);

  const frontHtml = useMemo(() => (editing ? mdToHtml(front) : card ? mdToHtml(card.front) : ""), [card, editing, front]);
  const backHtml = useMemo(() => (editing ? mdToHtml(back) : card ? mdToHtml(card.back) : ""), [card, editing, back]);

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
            const link = data.url || data.path; // prefer absolute url
            const md = data.isImage ? `![Image](${link})` : `[File](${link})`;
            const el = e.target as HTMLTextAreaElement;
            const { next, caret } = insertAtCursor(el, md);
            if (which === "front") setFront(next);
            else setBack(next);
            requestAnimationFrame(() => { try { el.selectionStart = el.selectionEnd = caret; } catch {} });
          }
          return;
        }
      }
    }
  }

  const onSave = async () => {
    const r = await fetch(`/api/cards/${encodeURIComponent(params.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, front, back }),
    });
    if (r.ok) {
      const data = await r.json();
      setCard(data.card);
      setEditing(false);
    }
  };

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls">
          <a className="link" href="/cards">← Back to cards</a>
          <a className="link" href="/cards/new">+ New</a>
        </div>
        <div className="status">{card?.group || "default"}</div>
      </div>

      {!card ? (
        <div>Loading…</div>
      ) : (
        <div>
          <div className="toolbar">
            <div className="controls" style={{ gap: 8 }}>
              {!editing ? (
                <>
                  <button className="primary" onClick={() => setEditing(true)}>Edit</button>
                  <button className="again" onClick={async () => {
                    if (!card) return;
                    if (!confirm(`Delete card ${card.id}?`)) return;
                    const r = await fetch(`/api/cards/${encodeURIComponent(card.id)}`, { method: 'DELETE' });
                    if (r.ok) window.location.href = '/cards';
                  }}>Delete</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(false)}>Cancel</button>
                  <button className="primary" onClick={onSave}>Save</button>
                </>
              )}
            </div>
            <div className="status">{card.group || "default"}</div>
          </div>

          {!editing ? (
            <div className="card">
              <div className="card-title">{card.title || card.id}</div>
              <div className="card-body" dangerouslySetInnerHTML={{ __html: showBack ? backHtml : frontHtml }} />
              <div className="actions" style={{ marginTop: 12 }}>
                {!showBack ? (
                  <button className="primary" onClick={() => setShowBack(true)}>Show Answer</button>
                ) : (
                  <button onClick={() => setShowBack(false)}>Show Question</button>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <h3>Performance</h3>
                <TimeSeries
                  points={history.map((l, i) => ({ x: l.ts, y: i + 1 }))}
                  events={history.map((l) => ({ x: l.ts, grade: l.grade }))}
                  yLabel="Reviews"
                />
                <div style={{ height: 8 }} />
                <GradeSeries events={history.map((l) => ({ x: l.ts, grade: l.grade }))} />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-title">Edit: {card.id}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="search" style={{ width: '100%' }} />
                  <label className="label" style={{ display: 'block', marginTop: 10 }}>Front</label>
                  <textarea value={front} onChange={(e) => setFront(e.target.value)} onPaste={(e) => handlePaste(e, 'front')} style={{ width: '100%', height: 180 }} className="search" />
                  <label className="label" style={{ display: 'block', marginTop: 10 }}>Back</label>
                  <textarea value={back} onChange={(e) => setBack(e.target.value)} onPaste={(e) => handlePaste(e, 'back')} style={{ width: '100%', height: 180 }} className="search" />
                </div>
                <div>
                  <div className="card-title">Preview</div>
                  <div className="card-body" dangerouslySetInnerHTML={{ __html: mdToHtml(front) }} />
                  <hr style={{ borderColor: '#262c46', margin: '12px 0' }} />
                  <div className="card-body" dangerouslySetInnerHTML={{ __html: mdToHtml(back) }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

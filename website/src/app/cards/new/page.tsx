"use client";

import { useEffect, useState } from "react";
import type { ClipboardEvent } from "react";

function useQuery() {
  const [q, setQ] = useState<URLSearchParams>(new URLSearchParams());
  useEffect(() => {
    if (typeof window !== "undefined") setQ(new URLSearchParams(window.location.search));
  }, []);
  return q;
}

export default function NewCardPage() {
  const q = useQuery();
  const [title, setTitle] = useState("");
  const [group, setGroup] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const g = q.get("group");
    if (g) setGroup(g);
  }, [q.toString()]);

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
            const md = data.isImage ? `![Image](${data.path})` : `[File](${data.path})`;
            const el = e.target as HTMLTextAreaElement;
            const { next, caret } = insertAtCursor(el, md);
            if (which === "front") setFront(next);
            else setBack(next);
            // place cursor after inserted text (best-effort)
            requestAnimationFrame(() => { try { el.selectionStart = el.selectionEnd = caret; } catch {} });
          }
          return;
        }
      }
    }
  }

  const onSave = async () => {
    setSaving(true);
    const r = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, group: group || undefined, front, back }),
    });
    setSaving(false);
    if (r.ok) {
      const data = await r.json();
      window.location.href = `/cards/${encodeURIComponent(data.card.id)}`;
    }
  };

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls" style={{ gap: 8 }}>
          <a className="link" href="/cards">← Back</a>
        </div>
        <div className="status">New Card</div>
      </div>

      <div className="card">
        <div className="card-title">Create New Card</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="search" style={{ width: '100%' }} />
            <label className="label" style={{ display: 'block', marginTop: 10 }}>Group (optional)</label>
            <input value={group} onChange={(e) => setGroup(e.target.value)} className="search" style={{ width: '100%' }} />
            <label className="label" style={{ display: 'block', marginTop: 10 }}>Front</label>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} onPaste={(e) => handlePaste(e, "front")} style={{ width: '100%', height: 180 }} className="search" />
            <label className="label" style={{ display: 'block', marginTop: 10 }}>Back</label>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} onPaste={(e) => handlePaste(e, "back")} style={{ width: '100%', height: 180 }} className="search" />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => { window.location.href = '/cards'; }}>Cancel</button>
              <button className="primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

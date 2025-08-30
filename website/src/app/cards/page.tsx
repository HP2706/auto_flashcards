"use client";

import { useEffect, useMemo, useState } from "react";

type Card = { id: string; title?: string; front: string; back: string; group?: string };

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [group, setGroup] = useState<string>("");
  const [q, setQ] = useState("");

  const refresh = async (g = group) => {
    const p = new URLSearchParams();
    if (g) p.set("group", g);
    const r = await fetch(`/api/cards?${p.toString()}`);
    const data = await r.json();
    setCards(data.cards);
    setGroups(data.groups || []);
  };

  useEffect(() => {
    refresh("");
  }, []);

  useEffect(() => {
    refresh(group);
  }, [group]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((c) =>
      (c.title || c.id).toLowerCase().includes(needle) || c.front.toLowerCase().includes(needle)
    );
  }, [cards, q]);

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls">
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
          <input
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="search"
          />
        </div>
        <div className="status">Cards: {filtered.length}</div>
      </div>

      <div className="grid">
        {filtered.map((c) => (
          <a key={c.id} href={`/cards/${encodeURIComponent(c.id)}`} className="tile" title="Open card">
            <div className="tile-title">{c.title || c.id}</div>
            <div className="tile-meta">{c.group || "default"}</div>
          </a>
        ))}
      </div>
    </main>
  );
}

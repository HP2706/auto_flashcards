"use client";

import { useState } from "react";

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const onCreate = async () => {
    const grp = name.trim();
    if (!grp) return;
    setSaving(true);
    const r = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: grp }),
    });
    setSaving(false);
    if (r.ok) {
      window.location.href = `/cards?group=${encodeURIComponent(grp)}`;
    }
  };

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls" style={{ gap: 8 }}>
          <a className="link" href="/cards">← Back</a>
        </div>
        <div className="status">New Group</div>
      </div>

      <div className="card">
        <div className="card-title">Create New Group</div>
        <label className="label" style={{ display: 'block', marginBottom: 6 }}>Group Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="search" style={{ width: '100%' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => { window.location.href = '/cards'; }}>Cancel</button>
          <button className="primary" disabled={saving || !name.trim()} onClick={onCreate}>{saving ? 'Creating…' : 'Create'}</button>
        </div>
      </div>
    </main>
  );
}


"use client";

import React from "react";

export function BarChart({ data, width = 640, height = 240, label = "Count" }: { data: { label: string; value: number }[]; width?: number; height?: number; label?: string }) {
  const padL = 40, padB = 28, padT = 10, padR = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (width - padL - padR) / Math.max(1, data.length);
  const ticks = 4;
  return (
    <svg width={width} height={height} style={{ background: "#151a2e", border: "1px solid #262c46", borderRadius: 8 }}>
      {/* Y axis */}
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#262c46" />
      {/* Ticks */}
      {Array.from({ length: ticks + 1 }, (_, i) => i).map((i) => {
        const v = (max * i) / ticks;
        const y = height - padB - ((height - padB - padT) * i) / ticks;
        return (
          <g key={i}>
            <line x1={padL - 4} y1={y} x2={width - padR} y2={y} stroke="#1b2040" />
            <text x={padL - 8} y={y + 4} fontSize={11} fill="#8a93b2" textAnchor="end">{Math.round(v)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = ((height - padB - padT) * d.value) / max;
        const x = padL + i * bw;
        const y = height - padB - h;
        return (
          <g key={d.label}>
            <rect x={x + 6} y={y} width={bw - 12} height={h} fill="#5b7cfa" />
            <text x={x + bw / 2} y={height - 8} fill="#8a93b2" fontSize={11} textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
      <text x={10} y={14} fontSize={11} fill="#8a93b2">{label}</text>
    </svg>
  );
}

export function TimeSeries({ points, events, width = 760, height = 260, yLabel = "Reviews" }: { points: { x: number; y: number }[]; events?: { x: number; grade: string }[]; width?: number; height?: number; yLabel?: string }) {
  if (points.length === 0) return <div style={{ color: "#8a93b2" }}>No data</div>;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);
  const padL = 48, padB = 28, padT = 10, padR = 10;
  const sx = (x: number) => padL + ((x - minX) / Math.max(1, maxX - minX)) * (width - padL - padR);
  const sy = (y: number) => height - padB - ((y - minY) / Math.max(1, maxY - minY)) * (height - padB - padT);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");
  const ticks = 4;
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => minX + ((maxX - minX) * i) / ticks);
  const colors: Record<string, string> = { again: "#ff6b6b", hard: "#ffd25e", good: "#2bb673", easy: "#37c0e2" };
  const fmtDate = (ts: number) => {
    const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  return (
    <svg width={width} height={height} style={{ background: "#151a2e", border: "1px solid #262c46", borderRadius: 8 }}>
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#262c46" />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#262c46" />
      {/* Y ticks */}
      {Array.from({ length: ticks + 1 }, (_, i) => i).map((i) => {
        const v = minY + ((maxY - minY) * i) / ticks;
        const y = sy(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1b2040" />
            <text x={padL - 8} y={y + 4} fontSize={11} fill="#8a93b2" textAnchor="end">{Math.round(v)}</text>
          </g>
        );
      })}
      {/* X ticks */}
      {xTicks.map((tx, i) => (
        <g key={i}>
          <line x1={sx(tx)} y1={height - padB} x2={sx(tx)} y2={padT} stroke="#1b2040" />
          <text x={sx(tx)} y={height - padB + 16} fontSize={11} fill="#8a93b2" textAnchor="middle">{fmtDate(tx)}</text>
        </g>
      ))}
      {/* Line */}
      <path d={d} fill="none" stroke="#2bb673" strokeWidth={2} />
      {/* Event markers */}
      {events?.map((e, i) => {
        let idx = points.findIndex((p) => p.x > e.x); if (idx === -1) idx = points.length;
        const y = idx > 0 ? points[idx - 1].y : 0;
        return <circle key={i} cx={sx(e.x)} cy={sy(y)} r={3} fill={colors[e.grade] || "#8a93b2"} />;
      })}
      <text x={10} y={14} fontSize={11} fill="#8a93b2">{yLabel}</text>
    </svg>
  );
}

export function GradeSeries({ events, width = 760, height = 200 }: { events: { x: number; grade: string }[]; width?: number; height?: number }) {
  if (!events || events.length === 0) return <div style={{ color: "#8a93b2" }}>No data</div>;
  const gIdx: Record<string, number> = { again: 0, hard: 1, good: 2, easy: 3 };
  const labels = ["Again", "Hard", "Good", "Easy"];
  const xs = events.map((e) => e.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const padL = 64, padB = 28, padT = 10, padR = 10;
  const sx = (x: number) => padL + ((x - minX) / Math.max(1, maxX - minX)) * (width - padL - padR);
  const sy = (i: number) => padT + ((3 - i) / 3) * (height - padB - padT);
  const colors: Record<string, string> = { again: "#ff6b6b", hard: "#ffd25e", good: "#2bb673", easy: "#37c0e2" };
  const fmtDate = (ts: number) => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const xTicks = Array.from({ length: 4 + 1 }, (_, i) => minX + ((maxX - minX) * i) / 4);
  return (
    <svg width={width} height={height} style={{ background: "#151a2e", border: "1px solid #262c46", borderRadius: 8 }}>
      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#262c46" />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#262c46" />
      {labels.map((lab, i) => (
        <g key={lab}>
          <line x1={padL} y1={sy(i)} x2={width - padR} y2={sy(i)} stroke="#1b2040" />
          <text x={padL - 10} y={sy(i) + 4} fill="#8a93b2" fontSize={11} textAnchor="end">{lab}</text>
        </g>
      ))}
      {xTicks.map((tx, i) => (
        <g key={i}>
          <line x1={sx(tx)} y1={height - padB} x2={sx(tx)} y2={padT} stroke="#1b2040" />
          <text x={sx(tx)} y={height - padB + 16} fontSize={11} fill="#8a93b2" textAnchor="middle">{fmtDate(tx)}</text>
        </g>
      ))}
      {events.map((e, i) => (
        <circle key={i} cx={sx(e.x)} cy={sy(gIdx[e.grade] ?? 0)} r={3} fill={colors[e.grade] || "#8a93b2"} />
      ))}
      <text x={10} y={14} fontSize={11} fill="#8a93b2">Grade over time</text>
    </svg>
  );
}


import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { getLaunchTimeline } from '../services/api';

// Color palette keyed by mission status (lowercased).
const STATUS_COLORS = {
  planning:  '#64748b', // slate
  scheduled: '#3b82f6', // blue
  go:        '#22c55e', // green
  hold:      '#f59e0b', // amber
  scrubbed:  '#ef4444', // red
  launched:  '#0ea5e9', // sky
  success:   '#10b981', // emerald
  failure:   '#dc2626', // red-600
  delayed:   '#a855f7', // purple
};

function colorFor(status) {
  return STATUS_COLORS[String(status || '').toLowerCase()] || '#94a3b8';
}

function TimelineTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.name}</div>
      <div>Mission: {row.mission_id}</div>
      <div>Vehicle: {row.vehicle_id || '—'}</div>
      <div>Type: {row.mission_type || '—'}</div>
      <div>Status: <span style={{ color: colorFor(row.status) }}>{row.status}</span></div>
      <div>Launch: {row.launch_date ? new Date(row.launch_date).toISOString().slice(0, 10) : '—'}</div>
      <div>Duration: {row.duration_days} day{row.duration_days === 1 ? '' : 's'}</div>
    </div>
  );
}

export default function LaunchTimeline() {
  const [rows, setRows]   = useState([]);
  const [origin, setOrigin] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getLaunchTimeline();
        if (!alive) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setOrigin(data?.origin || null);
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#64748b' }}>Loading launch timeline…</div>;
  if (error)   return <div style={{ padding: 16, color: '#ef4444' }}>Failed to load timeline: {error}</div>;
  if (!rows.length) return <div style={{ padding: 16, color: '#64748b' }}>No missions with launch_date.</div>;

  const height = Math.max(320, rows.length * 28 + 80);
  const originLabel = origin ? new Date(origin).toISOString().slice(0, 10) : '';

  // Build status legend dynamically from data present
  const seenStatuses = Array.from(new Set(rows.map((r) => r.status))).slice(0, 8);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
        Origin day 0 = <strong>{originLabel}</strong> · {rows.length} missions
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ top: 16, right: 24, bottom: 24, left: 140 }}
            barCategoryGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Days from origin',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 12, fill: '#475569' },
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <Tooltip content={<TimelineTooltip />} />
            {/* Invisible offset bar pushes the visible bar to start_day */}
            <Bar dataKey="offset" stackId="gantt" fill="transparent" isAnimationActive={false} />
            {/* Visible duration bar — colored by status */}
            <Bar dataKey="bar" stackId="gantt" name="Mission" isAnimationActive={false}>
              {rows.map((row, i) => (
                <Cell key={i} fill={colorFor(row.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {seenStatuses.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, background: colorFor(s), display: 'inline-block', borderRadius: 2 }} />
            <span style={{ color: '#475569' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

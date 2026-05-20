import React, { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea,
} from 'recharts';
import { getConjunctionRisk } from '../services/api';

const ZONE_COLORS = {
  red:   '#dc2626',
  amber: '#f59e0b',
  green: '#16a34a',
};

function RiskTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.conj_id}</div>
      <div>{p.object_a} ↔ {p.object_b}</div>
      <div>Miss: <strong>{p.miss_distance_km.toFixed(3)} km</strong></div>
      <div>Pc: <strong>{p.probability_pct}%</strong></div>
      <div>TCA: {p.tca_at ? new Date(p.tca_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'}</div>
      <div>Zone: <span style={{ color: ZONE_COLORS[p.zone] }}>{p.zone}</span></div>
    </div>
  );
}

export default function ConjunctionScatter() {
  const [points, setPoints]   = useState([]);
  const [summary, setSummary] = useState({ red: 0, amber: 0, green: 0 });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getConjunctionRisk();
        if (!alive) return;
        setPoints(Array.isArray(data?.points) ? data.points : []);
        setSummary(data?.summary || { red: 0, amber: 0, green: 0 });
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#64748b' }}>Loading conjunction risk…</div>;
  if (error)   return <div style={{ padding: 16, color: '#ef4444' }}>Failed to load risk: {error}</div>;
  if (!points.length) return <div style={{ padding: 16, color: '#64748b' }}>No debris-conjunction data.</div>;

  // Split data per-zone so each series gets its own color
  const seriesByZone = {
    red:   points.filter((p) => p.zone === 'red'),
    amber: points.filter((p) => p.zone === 'amber'),
    green: points.filter((p) => p.zone === 'green'),
  };

  // X scale: clamp upper bound so dense distributions are readable
  const maxMiss = Math.max(10, ...points.map((p) => p.miss_distance_km));
  const maxProb = Math.max(0.2, ...points.map((p) => p.probability));

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
        {points.length} conjunctions &middot;{' '}
        <span style={{ color: ZONE_COLORS.red }}>{summary.red} red</span>,{' '}
        <span style={{ color: ZONE_COLORS.amber }}>{summary.amber} amber</span>,{' '}
        <span style={{ color: ZONE_COLORS.green }}>{summary.green} green</span>
      </div>

      <div style={{ width: '100%', height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            {/* Background risk zones */}
            <ReferenceArea x1={0} x2={1}  y1={0.1} y2={maxProb} fill={ZONE_COLORS.red}   fillOpacity={0.08} stroke="none" />
            <ReferenceArea x1={1} x2={5}  y1={0}   y2={maxProb} fill={ZONE_COLORS.amber} fillOpacity={0.08} stroke="none" />
            <ReferenceArea x1={5} x2={maxMiss} y1={0} y2={maxProb} fill={ZONE_COLORS.green} fillOpacity={0.08} stroke="none" />

            <XAxis
              type="number"
              dataKey="miss_distance_km"
              name="Miss distance"
              unit=" km"
              domain={[0, Math.ceil(maxMiss)]}
              tick={{ fontSize: 11 }}
              label={{
                value: 'Miss distance (km)',
                position: 'insideBottom',
                offset: -12,
                style: { fontSize: 12, fill: '#475569' },
              }}
            />
            <YAxis
              type="number"
              dataKey="probability"
              name="Pc"
              domain={[0, Math.max(0.2, Number(maxProb.toFixed(3)))]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
              label={{
                value: 'Probability of collision',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#475569' },
              }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} name="TCA proximity" />

            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<RiskTooltip />} />
            <Legend verticalAlign="top" height={28} />

            <Scatter name="Red zone"   data={seriesByZone.red}   fill={ZONE_COLORS.red}   />
            <Scatter name="Amber zone" data={seriesByZone.amber} fill={ZONE_COLORS.amber} />
            <Scatter name="Green zone" data={seriesByZone.green} fill={ZONE_COLORS.green} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        Dot size scales with TCA proximity — larger dots = sooner Time of Closest Approach.
      </div>
    </div>
  );
}

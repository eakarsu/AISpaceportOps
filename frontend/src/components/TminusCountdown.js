import React, { useEffect, useRef, useState } from 'react';
import { getNextLaunch } from '../services/api';

function pad2(n) {
  const s = String(Math.abs(Math.trunc(n)));
  return s.length < 2 ? `0${s}` : s;
}

// secondsToLaunch > 0 → T-..., <= 0 → T+...
function formatCountdown(secondsToLaunch) {
  if (secondsToLaunch === null || secondsToLaunch === undefined || Number.isNaN(secondsToLaunch)) {
    return { sign: 'T-', text: '00:00:00:00', total: 0 };
  }
  const total = Number(secondsToLaunch);
  const sign  = total >= 0 ? 'T-' : 'T+';
  const abs   = Math.abs(total);
  const days  = Math.floor(abs / 86400);
  const hrs   = Math.floor((abs % 86400) / 3600);
  const mins  = Math.floor((abs % 3600) / 60);
  const secs  = Math.floor(abs % 60);
  return {
    sign,
    text: `${pad2(days)}:${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`,
    total,
  };
}

// Colour rule: red if <1h, amber if <24h, green otherwise.
function colorForSeconds(s, status) {
  if (status === 'scrubbed') return '#94a3b8'; // muted grey when paused
  if (s === null || s === undefined) return '#22c55e';
  if (s < 3600  && s >= 0) return '#dc2626';   // red, <1h to launch
  if (s < 86400 && s >= 0) return '#f59e0b';   // amber, <24h
  return '#22c55e';                            // green otherwise
}

export default function TminusCountdown() {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow]         = useState(Date.now());
  const tickRef = useRef(null);

  // Fetch the next launch once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getNextLaunch();
        if (!alive) return;
        setData(res || null);
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Drive the live countdown. Pauses when the selected mission is scrubbed.
  useEffect(() => {
    const status = data?.mission?.status;
    if (status === 'scrubbed') {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return undefined;
    }
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [data]);

  if (loading) return <div style={{ padding: 16, color: '#64748b' }}>Loading next launch…</div>;
  if (error)   return <div style={{ padding: 16, color: '#ef4444' }}>Failed to load countdown: {error}</div>;
  if (!data?.mission) {
    return <div style={{ padding: 16, color: '#64748b' }}>No scheduled missions found.</div>;
  }

  const m = data.mission;
  const launchMs = m.launch_date ? new Date(m.launch_date).getTime() : null;
  // Recompute seconds-to-launch each tick from the absolute launch timestamp
  // so the display stays accurate even after the page sits idle.
  const liveSeconds = launchMs !== null
    ? Math.round((launchMs - now) / 1000)
    : (data.seconds_to_launch ?? null);

  const isPaused = m.status === 'scrubbed';
  // When paused, freeze the display at whatever the server reported at fetch time
  const displaySeconds = isPaused ? (data.seconds_to_launch ?? 0) : liveSeconds;

  const { sign, text } = formatCountdown(displaySeconds);
  const color = colorForSeconds(displaySeconds, m.status);

  return (
    <div style={{ width: '100%' }} data-testid="tminus-countdown-wrapper">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <div
          data-testid="tminus-display"
          style={{
            background:    '#0f172a',
            color,
            borderRadius:  10,
            padding:       '20px 28px',
            fontFamily:    'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
            fontSize:      48,
            fontWeight:    700,
            letterSpacing: 2,
            minWidth:      360,
            textAlign:     'center',
            boxShadow:     '0 4px 14px rgba(15, 23, 42, 0.25)',
            border:        `2px solid ${color}`,
          }}
        >
          {sign}{text}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: '#0f172a' }}>
          <div>
            <strong style={{ fontSize: 16 }}>{m.name}</strong>
            &nbsp;<span style={{ color: '#64748b' }}>({m.mission_id})</span>
          </div>
          <div>Vehicle: <strong>{m.vehicle_id || '—'}</strong></div>
          <div>Type: {m.mission_type || '—'}</div>
          <div>Status: <strong style={{ color }}>{m.status}</strong>{isPaused ? ' (paused)' : ''}</div>
          <div>
            Launch date: {m.launch_date ? new Date(m.launch_date).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'}
          </div>
          <div>
            Window opens: {m.launch_window?.opens_at
              ? new Date(m.launch_window.opens_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
              : '—'}
          </div>
          {data.fallback ? (
            <div style={{ color: '#a16207', marginTop: 6, fontSize: 12 }}>
              No future launches scheduled — showing nearest mission.
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
        Format: T-DD:HH:MM:SS · Updates every second · Colour reflects time-to-launch
        (green &gt; 24h, amber &lt; 24h, red &lt; 1h).
      </div>
    </div>
  );
}

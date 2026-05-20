import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { path: '/missions',           title: 'Missions',           icon: 'M', color: '#3b82f6', desc: 'Launch manifest — scheduled, planning, scrubbed, integrated.' },
  { path: '/launch-vehicles',    title: 'Launch Vehicles',    icon: 'V', color: '#06b6d4', desc: 'Falcon 9, Vulcan, Ariane 6, Electron, Starship, New Glenn.' },
  { path: '/launch-windows',     title: 'Launch Windows',     icon: 'W', color: '#10b981', desc: 'Primary and backup instantaneous windows.' },
  { path: '/range-assignments',  title: 'Range Assignments',  icon: 'R', color: '#22c55e', desc: 'Pad and range slot bookings.' },

  { path: '/range-safety-zones', title: 'Range Safety Zones', icon: 'S', color: '#ef4444', desc: 'Blast / debris / airspace exclusion perimeters.' },
  { path: '/debris-conjunctions',title: 'Debris Conjunctions',icon: 'D', color: '#f97316', desc: 'On-orbit close approaches and TCA tracking.' },
  { path: '/comms-links',        title: 'Comms Links',        icon: 'C', color: '#a78bfa', desc: 'TT&C ground stations and frequencies.' },

  { path: '/payloads',           title: 'Payloads',           icon: 'P', color: '#ec4899', desc: 'Customer payload mass, orbit and integration status.' },
  { path: '/customers',          title: 'Customers',          icon: 'U', color: '#14b8a6', desc: 'Commercial, government, broker and academic customers.' },
  { path: '/fuel-inventory',     title: 'Fuel Inventory',     icon: 'F', color: '#facc15', desc: 'RP-1, LOX, LH2, CH4 stocks across pads.' },

  { path: '/weather-briefs',     title: 'Weather Briefs',     icon: 'X', color: '#7dd3fc', desc: 'Site weather and launch commit criteria evaluation.' },

  { path: '/anomalies',          title: 'Anomalies',          icon: '!', color: '#dc2626', desc: 'Open vehicle and ground system anomalies.' },
  { path: '/telemetry',          title: 'Telemetry',          icon: 'T', color: '#fb7185', desc: 'Mission telemetry channels (chamber pressure, thrust, etc).' },
  { path: '/recovery-assets',    title: 'Recovery Assets',    icon: 'A', color: '#34d399', desc: 'Drone ships, helicopters, RTLS pads, recovery ships.' },
  { path: '/ground-systems',     title: 'Ground Systems',     icon: 'G', color: '#60a5fa', desc: 'Strongbacks, TELs, fluid loading, sound suppression.' },

  { path: '/regulatory-approvals',title: 'Regulatory Approvals',icon: 'L', color: '#0ea5e9', desc: 'FAA AST / ESA / JAXA / NZ MoT approvals.' },
  { path: '/post-flight-reports', title: 'Post-Flight Reports', icon: 'B', color: '#a3e635', desc: 'Mission outcome narratives and lessons learned.' },
  { path: '/audit-log',           title: 'Audit Log',           icon: 'O', color: '#f472b6', desc: 'Operator actions on missions, approvals, anomalies.' },

  { path: '/ai/launch-window-optimize',  title: 'AI · Launch Window Optimize',   icon: '*', color: '#8b5cf6', desc: 'Primary + backup launch window selection.' },
  { path: '/ai/weather-window-brief',    title: 'AI · Weather Window Brief',     icon: '*', color: '#8b5cf6', desc: 'Launch commit criteria evaluation.' },
  { path: '/ai/mission-brief',           title: 'AI · Mission Brief',            icon: '*', color: '#8b5cf6', desc: 'Pre-launch mission summary and risks.' },
  { path: '/ai/recovery-plan',           title: 'AI · Recovery Plan',            icon: '*', color: '#8b5cf6', desc: 'Booster / capsule recovery sequencing.' },
  { path: '/ai/fuel-loadout-calc',       title: 'AI · Fuel Loadout Calc',        icon: '*', color: '#8b5cf6', desc: 'Stage propellant + pressurant loads.' },
  { path: '/ai/payload-trajectory-check',title: 'AI · Payload Trajectory Check', icon: '*', color: '#8b5cf6', desc: 'Insertion margin and delta-v check.' },
  { path: '/ai/ground-systems-checklist',title: 'AI · Ground Systems Checklist', icon: '*', color: '#8b5cf6', desc: 'Pad and GSE readiness checklist.' },
  { path: '/ai/ngs-link-budget',         title: 'AI · NGS Link Budget',          icon: '*', color: '#8b5cf6', desc: 'Ground-station / TT&C link budget.' },

  { path: '/ai/range-safety-assess',     title: 'AI · Range Safety Assess',      icon: '*', color: '#8b5cf6', desc: 'Hazard zone clearance and FTS status.' },
  { path: '/ai/conjunction-risk',        title: 'AI · Conjunction Risk',         icon: '*', color: '#8b5cf6', desc: 'On-orbit conjunction triage + maneuver options.' },
  { path: '/ai/anomaly-triage',          title: 'AI · Anomaly Triage',           icon: '*', color: '#8b5cf6', desc: 'Severity + likely causes + launch impact.' },
  { path: '/ai/debris-mitigation-plan',  title: 'AI · Debris Mitigation Plan',   icon: '*', color: '#8b5cf6', desc: 'FCC/FAA/ISO-24113 compliance plan.' },

  { path: '/ai/executive-brief',           title: 'AI · Executive Brief',           icon: '*', color: '#8b5cf6', desc: 'Spaceport command-level snapshot.' },
  { path: '/ai/post-flight-narrative',     title: 'AI · Post-Flight Narrative',     icon: '*', color: '#8b5cf6', desc: 'Mission outcome narrative.' },
  { path: '/ai/draft-press-release',       title: 'AI · Draft Press Release',       icon: '*', color: '#8b5cf6', desc: 'Public release for launch event.' },
  { path: '/ai/regulatory-compliance-check', title: 'AI · Regulatory Check',        icon: '*', color: '#8b5cf6', desc: 'Authority approvals and filings audit.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>Spaceport Operations</h2>
        <p>Commercial spaceflight ops snapshot · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Missions</div><div className="stat-value">{stats.missions?.total ?? '—'}</div><div className="stat-sub">{stats.missions?.scheduled ?? 0} scheduled · {stats.missions?.scrubbed ?? 0} scrubbed</div></div>
          <div className="stat"><div className="stat-label">Payloads</div><div className="stat-value">{stats.payloads?.total ?? '—'}</div><div className="stat-sub">{stats.payloads?.integrated ?? 0} integrated · {Number(stats.payloads?.total_mass_kg || 0).toLocaleString()} kg</div></div>
          <div className="stat"><div className="stat-label">Vehicles</div><div className="stat-value">{stats.launch_vehicles?.total ?? '—'}</div><div className="stat-sub">{stats.launch_vehicles?.available ?? 0} available · {stats.launch_vehicles?.reusable ?? 0} reusable</div></div>
          <div className="stat"><div className="stat-label">Customers</div><div className="stat-value">{stats.customers?.total ?? '—'}</div><div className="stat-sub">{stats.customers?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Windows</div><div className="stat-value">{stats.launch_windows?.total ?? '—'}</div><div className="stat-sub">{stats.launch_windows?.open_windows ?? 0} open</div></div>
          <div className="stat"><div className="stat-label">Range slots</div><div className="stat-value">{stats.range_assignments?.total ?? '—'}</div><div className="stat-sub">range bookings</div></div>
          <div className="stat"><div className="stat-label">Safety zones</div><div className="stat-value">{stats.range_safety_zones?.total ?? '—'}</div><div className="stat-sub">{stats.range_safety_zones?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Weather</div><div className="stat-value">{stats.weather_briefs?.total ?? '—'}</div><div className="stat-sub">{stats.weather_briefs?.go_count ?? 0} GO · {stats.weather_briefs?.no_go ?? 0} NO-GO</div></div>
          <div className="stat"><div className="stat-label">Recovery</div><div className="stat-value">{stats.recovery_assets?.total ?? '—'}</div><div className="stat-sub">{stats.recovery_assets?.available ?? 0} avail · {stats.recovery_assets?.deployed ?? 0} deployed</div></div>
          <div className="stat"><div className="stat-label">Fuel (kg)</div><div className="stat-value">{stats.fuel_inventory?.total ?? '—'}</div><div className="stat-sub">{Number(stats.fuel_inventory?.total_qty_kg || 0).toLocaleString()} kg total</div></div>
          <div className="stat"><div className="stat-label">Ground sys</div><div className="stat-value">{stats.ground_systems?.total ?? '—'}</div><div className="stat-sub">{stats.ground_systems?.nominal ?? 0} nominal · {stats.ground_systems?.maintenance ?? 0} maint</div></div>
          <div className="stat"><div className="stat-label">Telemetry</div><div className="stat-value">{stats.telemetry?.total ?? '—'}</div><div className="stat-sub">channels logged</div></div>
          <div className="stat"><div className="stat-label">Anomalies</div><div className="stat-value">{stats.anomalies?.total ?? '—'}</div><div className="stat-sub">{stats.anomalies?.critical ?? 0} crit · {stats.anomalies?.high ?? 0} high · {stats.anomalies?.open_count ?? 0} open</div></div>
          <div className="stat"><div className="stat-label">Conjunctions</div><div className="stat-value">{stats.debris_conjunctions?.total ?? '—'}</div><div className="stat-sub">{stats.debris_conjunctions?.high_pc ?? 0} elevated Pc</div></div>
          <div className="stat"><div className="stat-label">Comms</div><div className="stat-value">{stats.comms_links?.total ?? '—'}</div><div className="stat-sub">{stats.comms_links?.locked ?? 0} locked</div></div>
          <div className="stat"><div className="stat-label">Approvals</div><div className="stat-value">{stats.regulatory_approvals?.total ?? '—'}</div><div className="stat-sub">{stats.regulatory_approvals?.approved ?? 0} approved · {stats.regulatory_approvals?.pending ?? 0} pending</div></div>
          <div className="stat"><div className="stat-label">Post-flight</div><div className="stat-value">{stats.post_flight_reports?.total ?? '—'}</div><div className="stat-sub">{stats.post_flight_reports?.draft ?? 0} draft · {stats.post_flight_reports?.final ?? 0} final</div></div>
          <div className="stat"><div className="stat-label">Audit</div><div className="stat-value">{stats.audit_log?.total ?? '—'}</div><div className="stat-sub">log entries</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

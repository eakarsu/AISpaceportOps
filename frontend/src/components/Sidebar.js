import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const GROUPS = [
  {
    label: 'Launch Ops',
    links: [
      { to: '/missions',          label: 'Missions' },
      { to: '/launch-vehicles',   label: 'Launch Vehicles' },
      { to: '/launch-windows',    label: 'Launch Windows' },
      { to: '/range-assignments', label: 'Range Assignments' },
    ],
  },
  {
    label: 'Range Safety',
    links: [
      { to: '/range-safety-zones', label: 'Range Safety Zones' },
      { to: '/debris-conjunctions',label: 'Debris Conjunctions' },
      { to: '/comms-links',        label: 'Comms Links' },
    ],
  },
  {
    label: 'Payloads',
    links: [
      { to: '/payloads',           label: 'Payloads' },
      { to: '/customers',          label: 'Customers' },
      { to: '/customer-portfolio', label: 'Customer Portfolio' },
      { to: '/fuel-inventory',     label: 'Fuel Inventory' },
    ],
  },
  {
    label: 'Tenant Ops',
    links: [
      { to: '/tenant-comms',     label: 'Tenant Comms' },
      { to: '/marine-clearance', label: 'Marine Clearance' },
    ],
  },
  {
    label: 'Weather',
    links: [
      { to: '/weather-briefs', label: 'Weather Briefs' },
    ],
  },
  {
    label: 'Anomalies',
    links: [
      { to: '/anomalies',       label: 'Anomalies' },
      { to: '/telemetry',       label: 'Telemetry' },
      { to: '/recovery-assets', label: 'Recovery Assets' },
      { to: '/ground-systems',  label: 'Ground Systems' },
    ],
  },
  {
    label: 'Governance',
    links: [
      { to: '/regulatory-approvals', label: 'Regulatory Approvals' },
      { to: '/post-flight-reports',  label: 'Post-Flight Reports' },
      { to: '/audit-log',            label: 'Audit Log' },
    ],
  },
  {
    label: 'AI Planning',
    links: [
      { to: '/ai/launch-window-optimize',   label: 'AI · Launch Window Optimize' },
      { to: '/ai/weather-window-brief',     label: 'AI · Weather Window Brief' },
      { to: '/ai/mission-brief',            label: 'AI · Mission Brief' },
      { to: '/ai/recovery-plan',            label: 'AI · Recovery Plan' },
      { to: '/ai/fuel-loadout-calc',        label: 'AI · Fuel Loadout Calc' },
      { to: '/ai/payload-trajectory-check', label: 'AI · Payload Trajectory' },
      { to: '/ai/ground-systems-checklist',       label: 'AI · Ground Checklist' },
      { to: '/ai/payload-integration-checklist',  label: 'AI · Payload Integration' },
      { to: '/ai/ngs-link-budget',                label: 'AI · NGS Link Budget' },
    ],
  },
  {
    label: 'AI Safety',
    links: [
      { to: '/ai/range-safety-assess',    label: 'AI · Range Safety Assess' },
      { to: '/ai/conjunction-risk',       label: 'AI · Conjunction Risk' },
      { to: '/ai/anomaly-triage',         label: 'AI · Anomaly Triage' },
      { to: '/ai/debris-mitigation-plan', label: 'AI · Debris Mitigation' },
      { to: '/ai/sonic-boom-forecast',    label: 'AI · Sonic Boom Forecast' },
    ],
  },
  {
    label: 'AI Reporting',
    links: [
      { to: '/ai/executive-brief',             label: 'AI · Executive Brief' },
      { to: '/ai/post-flight-narrative',       label: 'AI · Post-Flight Narrative' },
      { to: '/ai/draft-press-release',         label: 'AI · Draft Press Release' },
      { to: '/ai/regulatory-compliance-check', label: 'AI · Regulatory Check' },
    ],
  },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>SPACEPORT OPS</h1>
        <p>Commercial Spaceflight Center</p>
      </div>

      <NavLink to="/" end>Overview</NavLink>
      <NavLink to="/custom-views">Mission Views</NavLink>

      {GROUPS.map((group) => (
        <React.Fragment key={group.label}>
          <div className="sidebar-group-label">{group.label}</div>
          {group.links.map((l) => (
            <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
          ))}
        </React.Fragment>
      ))}

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}

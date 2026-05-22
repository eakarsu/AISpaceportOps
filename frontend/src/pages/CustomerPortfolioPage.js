import React, { useEffect, useState } from 'react';
import { customerPortfolioApi } from '../services/api';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
};

function StatBox({ label, value, accent }) {
  return (
    <div style={{
      flex: 1,
      padding: '10px 14px',
      borderRadius: 6,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderLeft: `4px solid ${accent || '#94a3b8'}`,
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{value ?? '—'}</div>
    </div>
  );
}

function Table({ rows, columns, emptyLabel }) {
  if (!rows || rows.length === 0) return <div className="empty-state">{emptyLabel || 'No rows.'}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomerPortfolioPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    customerPortfolioApi.list()
      .then((d) => {
        const arr = d?.customers || [];
        setList(arr);
        if (arr.length > 0 && !selected) setSelected(arr[0]);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customer Portfolio</h2>
          <p>Multi-launch portfolio rollup per customer — payloads, missions, regulatory approvals and anomalies.</p>
        </div>
      </div>

      {loading && <div className="empty-state">Loading portfolio…</div>}
      {err && <div className="ai-error">{err}</div>}

      {!loading && list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Customers ({list.length})</h3>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {list.map((p) => (
                <div
                  key={p.customer.customer_id}
                  onClick={() => setSelected(p)}
                  style={{
                    padding: 10,
                    border: '1px solid ' + (selected?.customer?.customer_id === p.customer.customer_id ? '#2563eb' : '#e2e8f0'),
                    borderRadius: 6,
                    marginBottom: 6,
                    cursor: 'pointer',
                    background: selected?.customer?.customer_id === p.customer.customer_id ? '#eff6ff' : '#fff',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.customer.name || p.customer.customer_id}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {p.customer.type || '—'} · {p.counters.missions_count} missions · {p.counters.payloads_count} payloads
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selected && (
              <>
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0 }}>{selected.customer.name || selected.customer.customer_id}</h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                    {selected.customer.customer_id} · {selected.customer.country || '—'} · {selected.customer.type || '—'} · {selected.customer.status}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <StatBox label="Payloads" value={selected.counters.payloads_count} accent="#2563eb" />
                    <StatBox label="Mass (kg)" value={selected.counters.total_mass_kg} accent="#0891b2" />
                    <StatBox label="Missions" value={selected.counters.missions_count} accent="#7c3aed" />
                    <StatBox label="Scheduled" value={selected.counters.scheduled} accent="#16a34a" />
                    <StatBox label="Scrubbed" value={selected.counters.scrubbed} accent="#f59e0b" />
                    <StatBox label="Completed" value={selected.counters.completed} accent="#64748b" />
                    <StatBox label="Open Anomalies" value={selected.counters.open_anomalies} accent="#ef4444" />
                    <StatBox label="Critical / High" value={selected.counters.critical_anomalies} accent="#b91c1c" />
                    <StatBox label="Pending Approvals" value={selected.counters.pending_approvals} accent="#d97706" />
                  </div>
                </div>

                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0 }}>Missions</h4>
                  <Table
                    rows={selected.missions}
                    emptyLabel="No missions linked to this customer."
                    columns={[
                      { key: 'mission_id', label: 'Mission' },
                      { key: 'name',       label: 'Name' },
                      { key: 'vehicle_id', label: 'Vehicle' },
                      { key: 'launch_date',label: 'Launch Date' },
                      { key: 'status',     label: 'Status' },
                    ]}
                  />
                </div>

                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0 }}>Payloads</h4>
                  <Table
                    rows={selected.payloads}
                    emptyLabel="No payloads for this customer."
                    columns={[
                      { key: 'payload_id',   label: 'Payload' },
                      { key: 'mass_kg',      label: 'Mass (kg)' },
                      { key: 'target_orbit', label: 'Target Orbit' },
                      { key: 'vehicle_id',   label: 'Vehicle' },
                      { key: 'status',       label: 'Status' },
                    ]}
                  />
                </div>

                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0 }}>Regulatory Approvals</h4>
                  <Table
                    rows={selected.regulatory_approvals}
                    emptyLabel="No regulatory approvals tracked."
                    columns={[
                      { key: 'approval_id', label: 'Approval' },
                      { key: 'mission_id',  label: 'Mission' },
                      { key: 'authority',   label: 'Authority' },
                      { key: 'type',        label: 'Type' },
                      { key: 'status',      label: 'Status' },
                      { key: 'issued_at',   label: 'Issued' },
                    ]}
                  />
                </div>

                <div style={cardStyle}>
                  <h4 style={{ marginTop: 0 }}>Anomalies</h4>
                  <Table
                    rows={selected.anomalies}
                    emptyLabel="No anomalies on file."
                    columns={[
                      { key: 'anom_id',    label: 'Anomaly' },
                      { key: 'mission_id', label: 'Mission' },
                      { key: 'system',     label: 'System' },
                      { key: 'severity',   label: 'Severity' },
                      { key: 'status',     label: 'Status' },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

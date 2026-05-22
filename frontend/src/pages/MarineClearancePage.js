import React, { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { marineClearanceApi } from '../services/api';

export default function MarineClearancePage() {
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveFaaStatus, setLiveFaaStatus] = useState(null);
  const [conflictForm, setConflictForm] = useState({
    mission_id: '',
    area_desc: 'Atlantic downrange exclusion corridor',
    effective_from: '',
    effective_to: '',
  });
  const [conflictResult, setConflictResult] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictError, setConflictError] = useState('');

  const probeUscg = async () => {
    setLiveStatus({ loading: true });
    try {
      const r = await marineClearanceApi.liveUscg();
      setLiveStatus({ ok: true, data: r });
    } catch (e) {
      setLiveStatus({ ok: false, error: e.message });
    }
  };
  const probeFaa = async () => {
    setLiveFaaStatus({ loading: true });
    try {
      const r = await marineClearanceApi.liveFaaNotam();
      setLiveFaaStatus({ ok: true, data: r });
    } catch (e) {
      setLiveFaaStatus({ ok: false, error: e.message });
    }
  };

  useEffect(() => {
    probeUscg();
    probeFaa();
  }, []);

  const runConflictSummary = async (event) => {
    event.preventDefault();
    setConflictLoading(true);
    setConflictError('');
    setConflictResult(null);
    try {
      const result = await marineClearanceApi.conflictSummary({
        ...conflictForm,
        mission_id: conflictForm.mission_id || null,
      });
      setConflictResult(result);
    } catch (e) {
      setConflictError(e.message);
    } finally {
      setConflictLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        background: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
      }}>
        <strong>Live feeds NEEDS-CREDS.</strong> Live USCG NOTMAR and FAA NOTAM feeds require external credentials.
        The endpoints currently return HTTP 503 until <code>USCG_API_KEY</code> and <code>FAA_NOTAM_API_KEY</code> are provisioned.
        Draft notices manually below — operational marine clearance still requires safety officer sign-off.
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <div>
            <strong>USCG live:</strong>{' '}
            {liveStatus?.loading && '(probing…)'}
            {liveStatus?.ok && <span style={{ color: '#16a34a' }}>connected</span>}
            {liveStatus && !liveStatus.loading && !liveStatus.ok && (
              <span style={{ color: '#b91c1c' }}>503 — {liveStatus.error}</span>
            )}
            <button className="btn secondary" style={{ marginLeft: 8 }} onClick={probeUscg}>Probe</button>
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>FAA NOTAM live:</strong>{' '}
            {liveFaaStatus?.loading && '(probing…)'}
            {liveFaaStatus?.ok && <span style={{ color: '#16a34a' }}>connected</span>}
            {liveFaaStatus && !liveFaaStatus.loading && !liveFaaStatus.ok && (
              <span style={{ color: '#b91c1c' }}>503 — {liveFaaStatus.error}</span>
            )}
            <button className="btn secondary" style={{ marginLeft: 8 }} onClick={probeFaa}>Probe</button>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #dbeafe',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}>
        <h3 style={{ margin: '0 0 8px' }}>Clearance Conflict Summary</h3>
        <form onSubmit={runConflictSummary} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <label>
            <span style={{ display: 'block', fontSize: 12, color: '#475569' }}>Mission ID</span>
            <input className="input" value={conflictForm.mission_id} onChange={(e) => setConflictForm({ ...conflictForm, mission_id: e.target.value })} />
          </label>
          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ display: 'block', fontSize: 12, color: '#475569' }}>Area Description</span>
            <input className="input" value={conflictForm.area_desc} onChange={(e) => setConflictForm({ ...conflictForm, area_desc: e.target.value })} />
          </label>
          <label>
            <span style={{ display: 'block', fontSize: 12, color: '#475569' }}>Effective From</span>
            <input className="input" type="datetime-local" value={conflictForm.effective_from} onChange={(e) => setConflictForm({ ...conflictForm, effective_from: e.target.value })} />
          </label>
          <label>
            <span style={{ display: 'block', fontSize: 12, color: '#475569' }}>Effective To</span>
            <input className="input" type="datetime-local" value={conflictForm.effective_to} onChange={(e) => setConflictForm({ ...conflictForm, effective_to: e.target.value })} />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button className="btn" disabled={conflictLoading}>{conflictLoading ? 'Checking...' : 'Check conflicts'}</button>
          </div>
        </form>
        {conflictError && <div style={{ color: '#b91c1c', marginTop: 10 }}>{conflictError}</div>}
        {conflictResult && (
          <div style={{ marginTop: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
            <strong>{conflictResult.summary}</strong>
            <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 4 }}>
              Advisory only. Safety officer approval required.
            </div>
            {(conflictResult.conflicts || []).slice(0, 5).map((c) => (
              <div key={c.notice_id} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #bfdbfe' }}>
                <strong>{c.notice_id}</strong> · score {c.risk_score} · {c.notice_type} · {c.status}
                <div style={{ fontSize: 13 }}>{c.recommendation}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CrudPage
        title="Marine Clearance"
        subtitle="NOTMAR / NOTAM workflow. Draft notices, track effective windows, hand off to authorities."
        api={marineClearanceApi}
        statusKey="status"
        allowAttachments={false}
        fields={[
          { key: 'notice_id',      label: 'Notice ID' },
          { key: 'mission_id',     label: 'Mission ID' },
          { key: 'notice_type',    label: 'Type',      type: 'select', options: ['NOTMAR','NOTAM','other'] },
          { key: 'authority',      label: 'Authority' },
          { key: 'area_desc',      label: 'Area Description', type: 'textarea' },
          { key: 'effective_from', label: 'Effective From', type: 'datetime-local' },
          { key: 'effective_to',   label: 'Effective To',   type: 'datetime-local' },
          { key: 'status',         label: 'Status',    type: 'select', options: ['draft','submitted','active','expired','withdrawn'] },
        ]}
      />
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { tenantCommsApi, canWrite } from '../services/api';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
};

export default function TenantCommsPage() {
  const writer = canWrite();
  const [threads, setThreads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsErr, setThreadsErr] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composeBody, setComposeBody] = useState('');
  const [composeTemplate, setComposeTemplate] = useState('');
  const [composeApprove, setComposeApprove] = useState(false);
  const [sendErr, setSendErr] = useState(null);

  // New-thread form
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ customer_id: '', mission_id: '', subject: '', channel: 'portal' });

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true); setThreadsErr(null);
    try {
      const data = await tenantCommsApi.listThreads();
      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      setThreadsErr(e.message);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (thread) => {
    if (!thread) return;
    setLoadingMessages(true);
    try {
      const data = await tenantCommsApi.listMessages(thread.thread_id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => {
    tenantCommsApi.templates().then((d) => setTemplates(d?.templates || [])).catch(() => setTemplates([]));
  }, []);
  useEffect(() => { if (selected) loadMessages(selected); }, [selected, loadMessages]);

  const selectedTemplate = templates.find((t) => t.key === composeTemplate);
  const requiresApproval = !!selectedTemplate?.requires_safety_officer_approval;

  const applyTemplate = (key) => {
    setComposeTemplate(key);
    setComposeApprove(false);
    const tpl = templates.find((t) => t.key === key);
    if (tpl) setComposeBody(tpl.body || '');
  };

  const onSend = async () => {
    if (!selected || !composeBody.trim()) return;
    setSendErr(null);
    try {
      await tenantCommsApi.postMessage(selected.thread_id, {
        body: composeBody,
        template_key: composeTemplate || null,
        safety_officer_approved: composeApprove,
      });
      setComposeBody('');
      setComposeTemplate('');
      setComposeApprove(false);
      await loadMessages(selected);
    } catch (e) {
      setSendErr(e.message);
    }
  };

  const onCreateThread = async () => {
    if (!newThread.subject) return;
    try {
      const created = await tenantCommsApi.createThread(newThread);
      setShowNewThread(false);
      setNewThread({ customer_id: '', mission_id: '', subject: '', channel: 'portal' });
      await loadThreads();
      setSelected(created);
    } catch (e) {
      setThreadsErr(e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Tenant Comms</h2>
          <p>Multi-tenant customer messaging threads. Range-safety / hazard-zone / debris templates are advisory only and require safety officer approval.</p>
        </div>
        <div className="page-header-actions">
          {writer && (
            <button className="btn" onClick={() => setShowNewThread((v) => !v)}>
              {showNewThread ? 'Cancel' : 'New Thread'}
            </button>
          )}
          <button className="btn secondary" onClick={loadThreads}>Refresh</button>
        </div>
      </div>

      {showNewThread && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer ID</label>
              <input value={newThread.customer_id} onChange={(e) => setNewThread((s) => ({ ...s, customer_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Mission ID</label>
              <input value={newThread.mission_id} onChange={(e) => setNewThread((s) => ({ ...s, mission_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Channel</label>
              <select value={newThread.channel} onChange={(e) => setNewThread((s) => ({ ...s, channel: e.target.value }))}>
                <option value="portal">portal</option>
                <option value="email">email</option>
                <option value="sms">sms</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Subject</label>
              <input value={newThread.subject} onChange={(e) => setNewThread((s) => ({ ...s, subject: e.target.value }))} />
            </div>
          </div>
          <button className="btn" onClick={onCreateThread}>Create Thread</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Threads</h3>
          {loadingThreads && <div>Loading…</div>}
          {threadsErr && <div className="ai-error">{threadsErr}</div>}
          {!loadingThreads && threads.length === 0 && <div className="empty-state">No threads yet.</div>}
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                style={{
                  padding: 10,
                  border: '1px solid ' + (selected?.id === t.id ? '#2563eb' : '#e2e8f0'),
                  borderRadius: 6,
                  marginBottom: 6,
                  cursor: 'pointer',
                  background: selected?.id === t.id ? '#eff6ff' : '#fff',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.subject || t.thread_id}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {t.customer_id || '—'} · {t.mission_id || '—'} · {t.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          {!selected && <div className="empty-state">Select a thread to view messages.</div>}
          {selected && (
            <>
              <h3 style={{ marginTop: 0 }}>{selected.subject || selected.thread_id}</h3>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Customer: {selected.customer_id || '—'} · Mission: {selected.mission_id || '—'} · Channel: {selected.channel} · Status: {selected.status}
              </div>

              {loadingMessages && <div>Loading messages…</div>}
              <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
                {messages.map((m) => (
                  <div key={m.id} style={{
                    padding: 10, marginBottom: 8, borderRadius: 6,
                    background: m.author_side === 'tenant' ? '#f1f5f9' : '#fefce8',
                  }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                      <strong>{m.author}</strong> · {m.author_side} · {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                      {m.template_key && <> · <em>template: {m.template_key}</em></>}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.body}</div>
                  </div>
                ))}
                {messages.length === 0 && !loadingMessages && <div className="empty-state">No messages yet.</div>}
              </div>

              {writer && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div className="form-group">
                    <label>Apply Canned Template (optional)</label>
                    <select value={composeTemplate} onChange={(e) => applyTemplate(e.target.value)}>
                      <option value="">— none —</option>
                      {templates.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.key}{t.requires_safety_officer_approval ? ' (SAFETY APPROVAL REQUIRED)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea rows={4} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} />
                  </div>
                  {requiresApproval && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                      <strong>Advisory only.</strong> This template is flagged as requiring safety officer sign-off before send.
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 13 }}>
                          <input type="checkbox" checked={composeApprove} onChange={(e) => setComposeApprove(e.target.checked)} />
                          {' '}I confirm safety officer approval has been obtained.
                        </label>
                      </div>
                    </div>
                  )}
                  {sendErr && <div className="ai-error">{sendErr}</div>}
                  <button
                    className="btn"
                    onClick={onSend}
                    disabled={!composeBody.trim() || (requiresApproval && !composeApprove)}
                  >
                    Send Message
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

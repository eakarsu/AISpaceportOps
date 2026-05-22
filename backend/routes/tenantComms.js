// Tenant comms — multi-tenant customer messaging threads + messages.
// See _AUDIT_NOTE.md "tenant comms" gap. NEEDS-PRODUCT-DECISION:
//   - canned template_key values are advisory only (range-safety templates
//     marked requires_safety_officer_approval=true on send).

const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────
// Tenant comms templates (NEEDS-PRODUCT-DECISION)
// Hard-coded canned templates for tenant communication. Safety templates
// (range-hold, hazard-zone, debris go/no-go) are advisory only and require
// safety-officer approval before they can be sent.
// ──────────────────────────────────────────────
const TEMPLATES = [
  { key: 'launch-confirmed',   subject: 'Launch confirmed',      body: 'We have confirmed your launch slot for {{mission}}. T-0 target is {{t0_utc}} UTC.', requires_safety_officer_approval: false },
  { key: 'scrub-weather',      subject: 'Scrub — weather',       body: 'Mission {{mission}} has been scrubbed due to weather criteria violations. Backup window opens at {{backup_utc}} UTC.', requires_safety_officer_approval: false },
  { key: 'scrub-vehicle',      subject: 'Scrub — vehicle issue', body: 'Mission {{mission}} has been scrubbed due to a {{system}} anomaly. Recycle target {{recycle_utc}} UTC.', requires_safety_officer_approval: false },
  { key: 'range-hold',         subject: 'Range hold',            body: 'A range hold has been declared affecting {{mission}}. Reason: {{reason}}. This is an advisory; final range status pending safety officer sign-off.', requires_safety_officer_approval: true },
  { key: 'hazard-zone-update', subject: 'Hazard zone update',    body: 'Hazard zone {{zone_id}} for {{mission}} has been updated. New perimeter: {{perimeter_km}} km. ADVISORY ONLY — requires safety officer approval before action.', requires_safety_officer_approval: true },
  { key: 'debris-conjunction', subject: 'Debris conjunction',    body: 'Conjunction event {{conj_id}}: miss distance {{miss_km}} km, Pc {{pc}}. ADVISORY ONLY — safety officer must approve any operational response.', requires_safety_officer_approval: true },
  { key: 'integration-ready',  subject: 'Payload integration ready', body: 'Payload {{payload}} for {{mission}} has completed integration checks and is flight-ready.', requires_safety_officer_approval: false },
  { key: 'post-flight-recap',  subject: 'Post-flight recap',     body: 'Mission {{mission}} outcome: {{outcome}}. Full post-flight narrative attached.', requires_safety_officer_approval: false },
];

// GET /api/tenant-comms/templates
router.get('/templates', (req, res) => {
  res.json({ templates: TEMPLATES, count: TEMPLATES.length });
});

// ──────────────────────────────────────────────
// Threads
// ──────────────────────────────────────────────

// GET /api/tenant-comms/threads
router.get('/threads', async (req, res) => {
  try {
    const { customer_id, mission_id, status } = req.query;
    const where = [];
    const args = [];
    if (customer_id) { args.push(customer_id); where.push(`customer_id = $${args.length}`); }
    if (mission_id)  { args.push(mission_id);  where.push(`mission_id  = $${args.length}`); }
    if (status)      { args.push(status);      where.push(`status      = $${args.length}`); }
    const sql =
      `SELECT * FROM tenant_comms_threads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ` +
      `ORDER BY updated_at DESC LIMIT 500`;
    const r = await pool.query(sql, args);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/tenant-comms/threads/:id
router.get('/threads/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM tenant_comms_threads WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tenant-comms/threads
router.post('/threads', requireWriter, async (req, res) => {
  try {
    const { thread_id, customer_id, mission_id, subject, status, channel } = req.body || {};
    const id = thread_id || ('THR-' + Date.now().toString(36).toUpperCase());
    const r = await pool.query(
      `INSERT INTO tenant_comms_threads
         (thread_id, customer_id, mission_id, subject, status, channel, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, customer_id || null, mission_id || null, subject || null,
       status || 'open', channel || 'portal', req.user?.email || 'unknown']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tenant-comms/threads/:id
router.put('/threads/:id', requireWriter, async (req, res) => {
  try {
    const fields = ['customer_id','mission_id','subject','status','channel'];
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const vals = fields.map((f) => req.body[f] ?? null);
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE tenant_comms_threads SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      vals
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/tenant-comms/threads/:id
router.delete('/threads/:id', requireWriter, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM tenant_comms_threads WHERE id = $1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ──────────────────────────────────────────────
// Messages
// ──────────────────────────────────────────────

// GET /api/tenant-comms/threads/:thread_id/messages
router.get('/threads/:thread_id/messages', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM tenant_comms_messages WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.thread_id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tenant-comms/threads/:thread_id/messages
//   Body: { body, template_key?, author_side?, safety_officer_approved? }
//   If template_key requires safety-officer approval and the request did not
//   set safety_officer_approved=true, return 409 (advisory gate).
router.post('/threads/:thread_id/messages', requireWriter, async (req, res) => {
  try {
    const { body, template_key, author_side, safety_officer_approved } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body required' });

    if (template_key) {
      const tpl = TEMPLATES.find((t) => t.key === template_key);
      if (tpl && tpl.requires_safety_officer_approval && !safety_officer_approved) {
        return res.status(409).json({
          error: 'safety_officer_approval_required',
          template_key,
          requires_safety_officer_approval: true,
          notes: 'This template is advisory only and may not be sent without explicit safety officer sign-off.',
        });
      }
    }

    const r = await pool.query(
      `INSERT INTO tenant_comms_messages (thread_id, author, author_side, template_key, body)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.thread_id, req.user?.email || 'unknown',
       author_side || 'spaceport', template_key || null, body]
    );
    // Bump thread updated_at
    await pool.query(
      'UPDATE tenant_comms_threads SET updated_at = NOW() WHERE thread_id = $1',
      [req.params.thread_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

// Marine clearance coordinator — NOTMAR / NOTAM workflow.
// See _AUDIT_NOTE.md "marine-clearance coordinator" gap.
// Live USCG feed is NEEDS-CREDS — /live-uscg returns 503 until provisioned.
// All clearance authority output is advisory; final clearance requires
// safety officer sign-off (requires_safety_officer_approval=true).

const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

const router = express.Router();

// GET /api/marine-clearance
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM marine_clearance_notices ORDER BY id DESC LIMIT 500'
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/marine-clearance/:id
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM marine_clearance_notices WHERE id = $1', [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/marine-clearance
router.post('/', requireWriter, async (req, res) => {
  try {
    const {
      notice_id, mission_id, notice_type, authority,
      area_desc, effective_from, effective_to, status,
    } = req.body || {};
    const id = notice_id || ('NOTMAR-' + Date.now().toString(36).toUpperCase());
    const r = await pool.query(
      `INSERT INTO marine_clearance_notices
         (notice_id, mission_id, notice_type, authority, area_desc,
          effective_from, effective_to, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, mission_id || null, notice_type || 'NOTMAR', authority || null,
       area_desc || null, effective_from || null, effective_to || null,
       status || 'draft']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/marine-clearance/:id
router.put('/:id(\\d+)', requireWriter, async (req, res) => {
  try {
    const fields = ['mission_id','notice_type','authority','area_desc',
                    'effective_from','effective_to','status'];
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const vals = fields.map((f) => req.body[f] ?? null);
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE marine_clearance_notices SET ${sets}, updated_at = NOW()
        WHERE id = $${fields.length + 1} RETURNING *`,
      vals
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/marine-clearance/:id
router.delete('/:id(\\d+)', requireWriter, async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM marine_clearance_notices WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/marine-clearance/live-uscg
// Live USCG NOTMAR feed integration — NEEDS-CREDS.
// Returns 503 until USCG credentials are provisioned.
router.get('/live-uscg', (req, res) => {
  res.status(503).json({
    error: 'uscg_feed_not_configured',
    needs_creds: true,
    notes: 'USCG NOTMAR live feed requires USCG_API_KEY and USCG_API_BASE env vars. ' +
           'Until provisioned, draft NOTMAR/NOTAM notices manually via POST /api/marine-clearance.',
    requires_safety_officer_approval: true,
  });
});

// GET /api/marine-clearance/live-faa-notam
// Same posture for FAA NOTAM live feed.
router.get('/live-faa-notam', (req, res) => {
  res.status(503).json({
    error: 'faa_notam_feed_not_configured',
    needs_creds: true,
    notes: 'FAA NOTAM live feed requires FAA_NOTAM_API_KEY env var.',
    requires_safety_officer_approval: true,
  });
});

// POST /api/marine-clearance/conflict-summary
// Deterministic clearance-risk helper for planning meetings. It compares a
// proposed launch/recovery window against known draft/active notices and flags
// overlaps by time and area text. This is advisory only; it does not replace
// USCG/FAA authority review.
router.post('/conflict-summary', async (req, res) => {
  try {
    const {
      mission_id,
      area_desc = '',
      effective_from,
      effective_to,
      lookahead_days = 14,
    } = req.body || {};

    const start = effective_from ? new Date(effective_from) : new Date();
    const end = effective_to ? new Date(effective_to) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const areaTokens = String(area_desc)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((x) => x.length >= 4);

    const r = await pool.query(
      `SELECT *
         FROM marine_clearance_notices
        WHERE COALESCE(effective_from, NOW()) <= NOW() + ($1 || ' days')::interval
          AND COALESCE(effective_to, NOW()) >= NOW() - INTERVAL '1 day'
        ORDER BY effective_from NULLS LAST, id DESC
        LIMIT 500`,
      [lookahead_days]
    );

    const conflicts = r.rows.map((notice) => {
      const noticeStart = notice.effective_from ? new Date(notice.effective_from) : null;
      const noticeEnd = notice.effective_to ? new Date(notice.effective_to) : null;
      const timeOverlap = noticeStart && noticeEnd
        ? start <= noticeEnd && end >= noticeStart
        : false;
      const noticeText = String(notice.area_desc || '').toLowerCase();
      const areaMatches = areaTokens.filter((token) => noticeText.includes(token));
      const sameMission = mission_id && String(notice.mission_id || '') === String(mission_id);
      const score = (timeOverlap ? 50 : 0) + Math.min(30, areaMatches.length * 10) + (sameMission ? 20 : 0);
      return {
        notice_id: notice.notice_id,
        notice_type: notice.notice_type,
        status: notice.status,
        authority: notice.authority,
        time_overlap: timeOverlap,
        area_matches: areaMatches,
        risk_score: score,
        recommendation: score >= 70
          ? 'Coordinate with authority desk before publishing launch window.'
          : score >= 40
            ? 'Review manually; partial time or area overlap detected.'
            : 'No material conflict detected from local notices.',
      };
    }).filter((x) => x.risk_score > 0).sort((a, b) => b.risk_score - a.risk_score);

    res.json({
      advisory_only: true,
      requires_safety_officer_approval: true,
      requested_window: { mission_id: mission_id || null, area_desc, effective_from: start, effective_to: end },
      conflicts,
      summary: conflicts.length
        ? `${conflicts.length} local notice conflict(s) need review before clearance.`
        : 'No local marine/airspace notice conflicts detected.',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

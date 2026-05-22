// Customer multi-launch portfolio rollup.
// See _AUDIT_NOTE.md "customer multi-launch portfolio mgmt" gap.
// Joins customers + missions + payloads + regulatory_approvals into a
// single per-customer rollup for portfolio management.

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// GET /api/customer-portfolio
//   Returns rollup for every active customer.
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT customer_id, name, country, type, status FROM customers ORDER BY name ASC`
    );
    const rollups = [];
    for (const cust of r.rows) {
      rollups.push(await buildRollup(cust));
    }
    res.json({ count: rollups.length, customers: rollups });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/customer-portfolio/:customer_id
//   Returns rollup for a single customer.
router.get('/:customer_id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT customer_id, name, country, type, status FROM customers WHERE customer_id = $1`,
      [req.params.customer_id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'customer not found' });
    res.json(await buildRollup(r.rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function buildRollup(customer) {
  // Payloads booked by this customer
  const payloads = await pool.query(
    `SELECT payload_id, mass_kg, target_orbit, vehicle_id, status
     FROM payloads WHERE customer_id = $1 ORDER BY id ASC`,
    [customer.customer_id]
  );

  // Missions inferred by the union of vehicle_ids on customer's payloads.
  // (No direct customer_id on missions; we link via payload->vehicle->mission.)
  const vehicleIds = Array.from(new Set(payloads.rows.map((p) => p.vehicle_id).filter(Boolean)));
  let missions = { rows: [] };
  if (vehicleIds.length > 0) {
    missions = await pool.query(
      `SELECT mission_id, name, vehicle_id, launch_date, status, mission_type
       FROM missions WHERE vehicle_id = ANY($1::text[]) ORDER BY launch_date ASC NULLS LAST`,
      [vehicleIds]
    );
  }
  const missionIds = missions.rows.map((m) => m.mission_id).filter(Boolean);

  // Regulatory approvals per mission
  let approvals = { rows: [] };
  if (missionIds.length > 0) {
    approvals = await pool.query(
      `SELECT approval_id, mission_id, authority, type, status, issued_at
       FROM regulatory_approvals WHERE mission_id = ANY($1::text[]) ORDER BY id ASC`,
      [missionIds]
    );
  }

  // Anomalies tied to those missions
  let anomalies = { rows: [] };
  if (missionIds.length > 0) {
    anomalies = await pool.query(
      `SELECT anom_id, mission_id, system, severity, status, opened_at
       FROM anomalies WHERE mission_id = ANY($1::text[]) ORDER BY opened_at DESC NULLS LAST LIMIT 50`,
      [missionIds]
    );
  }

  // Roll-up counters
  const total_mass_kg = payloads.rows.reduce(
    (s, p) => s + (Number(p.mass_kg) || 0), 0
  );
  const scheduled    = missions.rows.filter((m) => (m.status || '').toLowerCase() === 'scheduled').length;
  const scrubbed     = missions.rows.filter((m) => (m.status || '').toLowerCase() === 'scrubbed').length;
  const completed    = missions.rows.filter((m) => (m.status || '').toLowerCase() === 'completed').length;
  const open_anoms   = anomalies.rows.filter((a) => (a.status || '').toLowerCase() === 'open').length;
  const critical_anoms = anomalies.rows.filter((a) => ['critical','high'].includes((a.severity || '').toLowerCase())).length;
  const pending_approvals = approvals.rows.filter((a) => (a.status || '').toLowerCase() !== 'approved').length;

  return {
    customer,
    counters: {
      payloads_count:    payloads.rows.length,
      total_mass_kg,
      missions_count:    missions.rows.length,
      scheduled,
      scrubbed,
      completed,
      open_anomalies:    open_anoms,
      critical_anomalies: critical_anoms,
      pending_approvals,
    },
    payloads: payloads.rows,
    missions: missions.rows,
    regulatory_approvals: approvals.rows,
    anomalies: anomalies.rows,
  };
}

module.exports = router;

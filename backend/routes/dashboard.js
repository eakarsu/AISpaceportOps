const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      vehicles, payloads, customers, missions, windows, ranges, zones, weather,
      recovery, fuel, ground, telemetry, anomalies, conj, comms, regs, reports, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE reusable=true) AS reusable, COUNT(*) FILTER (WHERE status='available') AS available FROM launch_vehicles"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='integrated') AS integrated, COUNT(*) FILTER (WHERE status='flight_ready') AS flight_ready, COALESCE(SUM(mass_kg),0) AS total_mass_kg FROM payloads"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM customers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='scrubbed') AS scrubbed, COUNT(*) FILTER (WHERE status='planning') AS planning FROM missions"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open_windows FROM launch_windows"),
      pool.query("SELECT COUNT(*) AS total FROM range_assignments"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM range_safety_zones"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE recommendation='GO') AS go_count, COUNT(*) FILTER (WHERE recommendation='NO-GO') AS no_go FROM weather_briefs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='available') AS available, COUNT(*) FILTER (WHERE status='deployed') AS deployed FROM recovery_assets"),
      pool.query("SELECT COUNT(*) AS total, COALESCE(SUM(qty_kg),0) AS total_qty_kg FROM fuel_inventory"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='nominal') AS nominal, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM ground_systems"),
      pool.query("SELECT COUNT(*) AS total FROM telemetry"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high, COUNT(*) FILTER (WHERE status='open') AS open_count FROM anomalies"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE probability>=0.0001) AS high_pc FROM debris_conjunctions"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='locked') AS locked FROM comms_links"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='approved') AS approved, COUNT(*) FILTER (WHERE status='pending') AS pending FROM regulatory_approvals"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='draft') AS draft, COUNT(*) FILTER (WHERE status='final') AS final FROM post_flight_reports"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);
    res.json({
      launch_vehicles:       vehicles.rows[0],
      payloads:              payloads.rows[0],
      customers:             customers.rows[0],
      missions:              missions.rows[0],
      launch_windows:        windows.rows[0],
      range_assignments:     ranges.rows[0],
      range_safety_zones:    zones.rows[0],
      weather_briefs:        weather.rows[0],
      recovery_assets:       recovery.rows[0],
      fuel_inventory:        fuel.rows[0],
      ground_systems:        ground.rows[0],
      telemetry:             telemetry.rows[0],
      anomalies:             anomalies.rows[0],
      debris_conjunctions:   conj.rows[0],
      comms_links:           comms.rows[0],
      regulatory_approvals:  regs.rows[0],
      post_flight_reports:   reports.rows[0],
      audit_log:             audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

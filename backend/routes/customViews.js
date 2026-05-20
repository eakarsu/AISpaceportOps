// Custom domain-specific views for AI Spaceport Ops
// Read-only aggregations used by the Mission Views page.

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Duration in days for each mission_type (used to render Gantt bar length).
const MISSION_TYPE_DURATION_DAYS = {
  'LEO Satellite Deployment': 3,
  'GEO Satellite Deployment': 7,
  'Crew Resupply':            5,
  'Crewed Orbital':          14,
  'Lunar Cargo':             21,
  'Interplanetary':          45,
  'Suborbital Tourism':       1,
  'Test Flight':              2,
  'Rideshare':                4,
  'ISS Resupply':             6,
};

function durationForType(t) {
  if (!t) return 2;
  if (MISSION_TYPE_DURATION_DAYS[t]) return MISSION_TYPE_DURATION_DAYS[t];
  // Heuristic for unseen types based on keywords
  const s = String(t).toLowerCase();
  if (s.includes('lunar') || s.includes('moon')) return 21;
  if (s.includes('crew'))   return 14;
  if (s.includes('inter'))  return 45;
  if (s.includes('geo'))    return 7;
  if (s.includes('leo'))    return 3;
  return 4;
}

// GET /api/custom-views/launch-timeline
// Returns one row per mission with launch_date offset (days from earliest)
// and a numeric duration so a recharts horizontal Bar can render a Gantt strip.
router.get('/launch-timeline', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, mission_id, name, vehicle_id, launch_date, status, mission_type
       FROM missions
       WHERE launch_date IS NOT NULL
       ORDER BY launch_date ASC
       LIMIT 40`
    );
    const rows = r.rows;
    if (rows.length === 0) {
      return res.json({ rows: [], origin: null, count: 0 });
    }
    const origin = new Date(rows[0].launch_date).getTime();
    const data = rows.map((m) => {
      const startMs = new Date(m.launch_date).getTime();
      const startDay = Math.max(0, Math.round((startMs - origin) / 86400000));
      const duration = durationForType(m.mission_type);
      return {
        id: m.id,
        mission_id: m.mission_id,
        name: m.name || m.mission_id,
        vehicle_id: m.vehicle_id,
        launch_date: m.launch_date,
        status: (m.status || 'planning').toLowerCase(),
        mission_type: m.mission_type,
        start_day: startDay,
        duration_days: duration,
        // recharts stacked-bar trick: invisible offset + visible duration
        offset: startDay,
        bar: duration,
      };
    });
    res.json({
      rows: data,
      origin: rows[0].launch_date,
      count: data.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/custom-views/conjunction-risk
// Returns scatter points for the debris-conjunction risk plot:
//   x  = miss_distance_km
//   y  = probability  (kept as 0..1 — the UI shows it as %)
//   z  = inverse TCA proximity (sooner TCA = larger dot)
//   zone = red / amber / green
router.get('/conjunction-risk', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, conj_id, object_a, object_b, miss_distance_km, probability, tca_at
       FROM debris_conjunctions
       ORDER BY tca_at ASC NULLS LAST
       LIMIT 200`
    );
    const now = Date.now();
    const points = r.rows.map((c) => {
      const miss = Number(c.miss_distance_km) || 0;
      const prob = Number(c.probability) || 0;
      let zone = 'green';
      if (miss < 1 && prob > 0.1) zone = 'red';
      else if (miss < 5) zone = 'amber';
      // TCA proximity score: hours until TCA, clamped 1..720; smaller = sooner = bigger dot
      let z = 80;
      if (c.tca_at) {
        const hrs = Math.max(1, Math.abs(new Date(c.tca_at).getTime() - now) / 3.6e6);
        const clamped = Math.min(720, hrs);
        z = Math.round(40 + (720 - clamped) / 720 * 360);
      }
      return {
        id: c.id,
        conj_id: c.conj_id,
        object_a: c.object_a,
        object_b: c.object_b,
        miss_distance_km: miss,
        probability: prob,
        probability_pct: Number((prob * 100).toFixed(3)),
        tca_at: c.tca_at,
        z,
        zone,
      };
    });
    const summary = {
      red:   points.filter((p) => p.zone === 'red').length,
      amber: points.filter((p) => p.zone === 'amber').length,
      green: points.filter((p) => p.zone === 'green').length,
    };
    res.json({ points, summary, count: points.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Range-Safety Zone Map ---------------------------------------------------
// Cape Canaveral reference point used to seed lat/lng for zones lacking coords.
const CAPE_LAT = 28.392;
const CAPE_LNG = -80.605;

let _rangeZoneLatLngEnsured = false;
async function ensureRangeZoneLatLng() {
  if (_rangeZoneLatLngEnsured) return;
  await pool.query(
    `ALTER TABLE range_safety_zones
       ADD COLUMN IF NOT EXISTS lat NUMERIC,
       ADD COLUMN IF NOT EXISTS lng NUMERIC`
  );
  // Seed any null coordinates with a random point within ~30km of Cape Canaveral.
  // ~30km ≈ 0.27° latitude. We sample uniformly inside that box and accept any
  // point; this gives a visible cluster around the launch site.
  const r = await pool.query(
    `SELECT id FROM range_safety_zones WHERE lat IS NULL OR lng IS NULL`
  );
  for (const row of r.rows) {
    // Random offset in degrees: ±0.27° lat, ±0.30° lng (compensating cos(lat))
    const dLat = (Math.random() - 0.5) * 0.54;
    const dLng = (Math.random() - 0.5) * 0.60;
    await pool.query(
      `UPDATE range_safety_zones SET lat = $1, lng = $2 WHERE id = $3`,
      [CAPE_LAT + dLat, CAPE_LNG + dLng, row.id]
    );
  }
  _rangeZoneLatLngEnsured = true;
}

// GET /api/custom-views/range-safety-zones
// Returns range_safety_zone rows with lat/lng + perimeter for Leaflet rendering.
router.get('/range-safety-zones', async (req, res) => {
  try {
    await ensureRangeZoneLatLng();
    const r = await pool.query(
      `SELECT id, zone_id, name, perimeter_km, hazard_type, classification, status, lat, lng
       FROM range_safety_zones
       ORDER BY id ASC
       LIMIT 200`
    );
    const zones = r.rows.map((z) => ({
      id: z.id,
      zone_id: z.zone_id,
      name: z.name || z.zone_id || `Zone ${z.id}`,
      perimeter_km: Number(z.perimeter_km) || 1,
      hazard_type: (z.hazard_type || 'exclusion').toLowerCase(),
      classification: z.classification || 'unclassified',
      status: z.status || 'unknown',
      lat: Number(z.lat),
      lng: Number(z.lng),
    }));
    res.json({
      center: { lat: CAPE_LAT, lng: CAPE_LNG, name: 'Cape Canaveral' },
      zones,
      count: zones.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- T-Minus Countdown -------------------------------------------------------
// GET /api/custom-views/next-launch
// Picks the next scheduled mission (lowest future launch_date), falling back to
// the nearest past mission if no future ones exist. Joins launch_windows for
// the opens_at field. Computes seconds_to_launch (negative = T+).
router.get('/next-launch', async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    // Try the next future mission first
    let r = await pool.query(
      `SELECT m.id, m.mission_id, m.name, m.vehicle_id, m.launch_date, m.status, m.mission_type,
              lw.opens_at AS window_opens_at, lw.closes_at AS window_closes_at
       FROM missions m
       LEFT JOIN LATERAL (
         SELECT opens_at, closes_at
         FROM launch_windows lw
         WHERE lw.mission_id = m.mission_id
         ORDER BY opens_at ASC NULLS LAST
         LIMIT 1
       ) lw ON true
       WHERE m.launch_date IS NOT NULL AND m.launch_date >= $1
       ORDER BY m.launch_date ASC
       LIMIT 1`,
      [nowIso]
    );
    let row = r.rows[0];
    let fallback = false;
    if (!row) {
      // No future launches — pick the nearest one (past or future) overall
      r = await pool.query(
        `SELECT m.id, m.mission_id, m.name, m.vehicle_id, m.launch_date, m.status, m.mission_type,
                lw.opens_at AS window_opens_at, lw.closes_at AS window_closes_at
         FROM missions m
         LEFT JOIN LATERAL (
           SELECT opens_at, closes_at
           FROM launch_windows lw
           WHERE lw.mission_id = m.mission_id
           ORDER BY opens_at ASC NULLS LAST
           LIMIT 1
         ) lw ON true
         WHERE m.launch_date IS NOT NULL
         ORDER BY ABS(EXTRACT(EPOCH FROM (m.launch_date - NOW()))) ASC
         LIMIT 1`
      );
      row = r.rows[0];
      fallback = true;
    }
    if (!row) {
      return res.json({ mission: null, seconds_to_launch: null, fallback: false });
    }
    const launchMs = new Date(row.launch_date).getTime();
    const secondsToLaunch = Math.round((launchMs - Date.now()) / 1000);
    res.json({
      mission: {
        id: row.id,
        mission_id: row.mission_id,
        name: row.name || row.mission_id,
        vehicle_id: row.vehicle_id,
        launch_date: row.launch_date,
        status: (row.status || 'planning').toLowerCase(),
        mission_type: row.mission_type,
        launch_window: {
          opens_at: row.window_opens_at,
          closes_at: row.window_closes_at,
        },
      },
      seconds_to_launch: secondsToLaunch,
      fallback,
      server_now: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

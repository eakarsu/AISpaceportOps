// Range safety zones — CRUD + GeoJSON polygon endpoints.
// See _AUDIT_NOTE.md "hazard-zone polygons" gap. GeoJSON polygon is a
// MECHANICAL addition (column geojson_polygon JSONB) and remains ADVISORY
// ONLY — operational use requires safety officer sign-off.

const express = require('express');
const buildCrud = require('./_crudFactory');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');

// Build the standard CRUD router first.
const crud = buildCrud({
  table: 'range_safety_zones',
  fields: ['zone_id','name','perimeter_km','hazard_type','classification','status'],
});

// Then layer GeoJSON polygon routes onto the same router instance.
const router = express.Router();
router.use(crud);

function validateGeoJsonPolygon(g) {
  if (!g || typeof g !== 'object') return 'geojson must be an object';
  const t = g.type;
  if (t !== 'Polygon' && t !== 'MultiPolygon' && t !== 'Feature') {
    return 'geojson.type must be Polygon | MultiPolygon | Feature';
  }
  if (t === 'Feature') {
    if (!g.geometry || typeof g.geometry !== 'object') return 'feature.geometry required';
    if (!['Polygon','MultiPolygon'].includes(g.geometry.type)) {
      return 'feature.geometry.type must be Polygon | MultiPolygon';
    }
    if (!Array.isArray(g.geometry.coordinates)) return 'feature.geometry.coordinates must be array';
  } else {
    if (!Array.isArray(g.coordinates)) return 'coordinates must be array';
  }
  return null;
}

// GET /api/range-safety-zones/:id/geojson
//   Returns geojson_polygon, polygon_source, polygon_updated_at.
router.get('/:id(\\d+)/geojson', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, zone_id, name, geojson_polygon, polygon_source, polygon_updated_at
         FROM range_safety_zones WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const row = r.rows[0];
    res.json({
      ...row,
      requires_safety_officer_approval: true,
      advisory_only: true,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/range-safety-zones/:id/geojson
//   Body: { geojson_polygon, polygon_source? }
router.put('/:id(\\d+)/geojson', requireWriter, async (req, res) => {
  try {
    const { geojson_polygon, polygon_source } = req.body || {};
    const err = validateGeoJsonPolygon(geojson_polygon);
    if (err) return res.status(400).json({ error: err });
    const r = await pool.query(
      `UPDATE range_safety_zones
          SET geojson_polygon = $1,
              polygon_source  = $2,
              polygon_updated_at = NOW(),
              updated_at = NOW()
        WHERE id = $3 RETURNING *`,
      [geojson_polygon, polygon_source || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({
      ...r.rows[0],
      requires_safety_officer_approval: true,
      advisory_only: true,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/range-safety-zones/:id/geojson
router.delete('/:id(\\d+)/geojson', requireWriter, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE range_safety_zones
          SET geojson_polygon = NULL,
              polygon_source = NULL,
              polygon_updated_at = NULL,
              updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'polygon cleared', row: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

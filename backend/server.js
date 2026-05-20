const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./config/database');
const { fireWebhook } = require('./services/webhooks');

// helpers kept for future hook wiring
async function _onAnomalyCreated(row) {
  const sev = String(row.severity || '').toLowerCase();
  if (['critical', 'high'].includes(sev)) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, severity, source)
         VALUES (NULL, $1, $2, $3, $4)`,
        [`Anomaly: ${row.system}`, `Mission ${row.mission_id} — ${row.system}`, sev, 'anomalies']
      );
    } catch (e) { console.warn('[notify] anomaly insert failed:', e.message); }
    fireWebhook(`anomaly.${sev}`, { row }).catch(() => {});
  }
}
void _onAnomalyCreated;

const app = express();
const PORT = process.env.BACKEND_PORT || 3067;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3066,http://localhost:3067,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Everything below requires a Bearer token
app.use('/api', authenticateToken);

// CRUD routes (18 spaceport entities — all via _crudFactory)
app.use('/api/launch-vehicles',      require('./routes/launchVehicles'));
app.use('/api/payloads',             require('./routes/payloads'));
app.use('/api/customers',            require('./routes/customers'));
app.use('/api/missions',             require('./routes/missions'));
app.use('/api/launch-windows',       require('./routes/launchWindows'));
app.use('/api/range-assignments',    require('./routes/rangeAssignments'));
app.use('/api/range-safety-zones',   require('./routes/rangeSafetyZones'));
app.use('/api/weather-briefs',       require('./routes/weatherBriefs'));
app.use('/api/recovery-assets',      require('./routes/recoveryAssets'));
app.use('/api/fuel-inventory',       require('./routes/fuelInventory'));
app.use('/api/ground-systems',       require('./routes/groundSystems'));
app.use('/api/telemetry',            require('./routes/telemetry'));
app.use('/api/anomalies',            require('./routes/anomalies'));
app.use('/api/debris-conjunctions',  require('./routes/debrisConjunctions'));
app.use('/api/comms-links',          require('./routes/commsLinks'));
app.use('/api/regulatory-approvals', require('./routes/regulatoryApprovals'));
app.use('/api/post-flight-reports',  require('./routes/postFlightReports'));
app.use('/api/audit-log',            require('./routes/auditLog'));

// AI routes (16 sub-endpoints + history under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom domain-specific aggregations (Mission Views)
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`\nAI Spaceport Ops API running on http://localhost:${PORT}\n`);
});

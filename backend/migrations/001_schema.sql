-- AISpaceportOps schema — commercial spaceflight operations
-- 18 domain tables + ai_results

CREATE TABLE IF NOT EXISTS launch_vehicles (
  id              SERIAL PRIMARY KEY,
  vehicle_id      VARCHAR(50) UNIQUE,
  vendor          VARCHAR(120),
  family          VARCHAR(120),
  version         VARCHAR(60),
  reusable        BOOLEAN DEFAULT FALSE,
  status          VARCHAR(30) DEFAULT 'available',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payloads (
  id              SERIAL PRIMARY KEY,
  payload_id      VARCHAR(50) UNIQUE,
  customer_id     VARCHAR(50),
  mass_kg         INTEGER DEFAULT 0,
  target_orbit    VARCHAR(60),
  vehicle_id      VARCHAR(50),
  status          VARCHAR(30) DEFAULT 'manifest',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  customer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  country         VARCHAR(80),
  contact         VARCHAR(150),
  type            VARCHAR(40),
  status          VARCHAR(30) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id              SERIAL PRIMARY KEY,
  mission_id      VARCHAR(50) UNIQUE,
  name            VARCHAR(200),
  vehicle_id      VARCHAR(50),
  launch_date     DATE,
  status          VARCHAR(30) DEFAULT 'planning',
  mission_type    VARCHAR(60),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launch_windows (
  id              SERIAL PRIMARY KEY,
  window_id       VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  opens_at        TIMESTAMPTZ,
  closes_at       TIMESTAMPTZ,
  probability_pct INTEGER DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS range_assignments (
  id              SERIAL PRIMARY KEY,
  assignment_id   VARCHAR(50) UNIQUE,
  range           VARCHAR(120),
  mission_id      VARCHAR(50),
  asset           VARCHAR(150),
  slot_start      TIMESTAMPTZ,
  slot_end        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS range_safety_zones (
  id              SERIAL PRIMARY KEY,
  zone_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  perimeter_km    NUMERIC(8,2) DEFAULT 0,
  hazard_type     VARCHAR(80),
  classification  VARCHAR(40),
  status          VARCHAR(30) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_briefs (
  id              SERIAL PRIMARY KEY,
  brief_id        VARCHAR(50) UNIQUE,
  site            VARCHAR(120),
  valid_at        TIMESTAMPTZ,
  ceiling_ft      INTEGER DEFAULT 0,
  winds_kt        INTEGER DEFAULT 0,
  recommendation  VARCHAR(40),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_assets (
  id              SERIAL PRIMARY KEY,
  asset_id        VARCHAR(50) UNIQUE,
  type            VARCHAR(60),
  location        VARCHAR(150),
  status          VARCHAR(30) DEFAULT 'available',
  capability      VARCHAR(200),
  last_ops        DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fuel_inventory (
  id              SERIAL PRIMARY KEY,
  stock_id        VARCHAR(50) UNIQUE,
  fuel_type       VARCHAR(40),
  qty_kg          INTEGER DEFAULT 0,
  location        VARCHAR(150),
  batch           VARCHAR(60),
  expiry          DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ground_systems (
  id              SERIAL PRIMARY KEY,
  system_id       VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  type            VARCHAR(60),
  location        VARCHAR(150),
  status          VARCHAR(30) DEFAULT 'nominal',
  last_check      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id              SERIAL PRIMARY KEY,
  point_id        VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  channel         VARCHAR(80),
  value           NUMERIC(14,4) DEFAULT 0,
  units           VARCHAR(40),
  ts              TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomalies (
  id              SERIAL PRIMARY KEY,
  anom_id         VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  system          VARCHAR(120),
  severity        VARCHAR(20) DEFAULT 'low',
  opened_at       TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debris_conjunctions (
  id              SERIAL PRIMARY KEY,
  conj_id         VARCHAR(50) UNIQUE,
  object_a        VARCHAR(120),
  object_b        VARCHAR(120),
  miss_distance_km NUMERIC(10,3) DEFAULT 0,
  probability     NUMERIC(10,8) DEFAULT 0,
  tca_at          TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comms_links (
  id              SERIAL PRIMARY KEY,
  link_id         VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  station         VARCHAR(120),
  freq_mhz        NUMERIC(10,3) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'standby',
  last_locked     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_approvals (
  id              SERIAL PRIMARY KEY,
  approval_id     VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  authority       VARCHAR(120),
  type            VARCHAR(80),
  status          VARCHAR(30) DEFAULT 'pending',
  issued_at       DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_flight_reports (
  id              SERIAL PRIMARY KEY,
  report_id       VARCHAR(50) UNIQUE,
  mission_id      VARCHAR(50),
  summary         TEXT,
  anomalies       TEXT,
  status          VARCHAR(30) DEFAULT 'draft',
  owner           VARCHAR(120),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(150),
  target          VARCHAR(200),
  action          VARCHAR(60),
  result          VARCHAR(40),
  ts              TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);

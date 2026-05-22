-- AISpaceportOps Apply pass 7 — full backlog implementation
-- See _AUDIT_NOTE.md ## Apply pass 7 (full backlog implementation)

-- 1) Hazard-zone GeoJSON polygons (NEEDS-PRODUCT-DECISION: advisory only,
--    requires_safety_officer_approval on AI consumers).
ALTER TABLE range_safety_zones
  ADD COLUMN IF NOT EXISTS geojson_polygon JSONB,
  ADD COLUMN IF NOT EXISTS polygon_source  VARCHAR(120),
  ADD COLUMN IF NOT EXISTS polygon_updated_at TIMESTAMPTZ;

-- 2) Tenant comms (multi-tenant customer messaging threads)
CREATE TABLE IF NOT EXISTS tenant_comms_threads (
  id            SERIAL PRIMARY KEY,
  thread_id     VARCHAR(60) UNIQUE,
  customer_id   VARCHAR(50),
  mission_id    VARCHAR(50),
  subject       VARCHAR(300),
  status        VARCHAR(30) DEFAULT 'open',  -- open|pending|closed
  channel       VARCHAR(40) DEFAULT 'portal', -- portal|email|sms
  created_by    VARCHAR(150),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_comms_threads_customer
  ON tenant_comms_threads (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_comms_threads_mission
  ON tenant_comms_threads (mission_id);

CREATE TABLE IF NOT EXISTS tenant_comms_messages (
  id            SERIAL PRIMARY KEY,
  thread_id     VARCHAR(60),
  author        VARCHAR(150),
  author_side   VARCHAR(20) DEFAULT 'spaceport', -- spaceport|tenant|system
  template_key  VARCHAR(80),
  body          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_comms_messages_thread
  ON tenant_comms_messages (thread_id, created_at DESC);

-- 3) Marine clearance notices (NOTMAR/NOTAM workflow).
--    Live USCG feed is NEEDS-CREDS — endpoint returns 503 until provisioned.
CREATE TABLE IF NOT EXISTS marine_clearance_notices (
  id              SERIAL PRIMARY KEY,
  notice_id       VARCHAR(60) UNIQUE,
  mission_id      VARCHAR(50),
  notice_type     VARCHAR(40) DEFAULT 'NOTMAR', -- NOTMAR|NOTAM|other
  authority       VARCHAR(120),
  area_desc       TEXT,
  effective_from  TIMESTAMPTZ,
  effective_to    TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'draft',  -- draft|submitted|active|expired|withdrawn
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marine_clearance_mission
  ON marine_clearance_notices (mission_id, status);

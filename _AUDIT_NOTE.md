# Audit Note — AISpaceportOps

Audit-only pass. Stack: Node + Express + React + Postgres + OpenRouter.
Domain: spaceport operations — launch scheduling, range safety, weather criteria, payload integration, FAA launch licenses.

## Implemented
None — audit-only.

## Inventory

### CRUD routes (18, all under `/api`)
launch-vehicles, payloads, customers, missions, launch-windows, range-assignments, range-safety-zones, weather-briefs, recovery-assets, fuel-inventory, ground-systems, telemetry, anomalies, debris-conjunctions, comms-links, regulatory-approvals, post-flight-reports, audit-log. Cross-cutting: notifications, attachments, webhooks, dashboard, custom-views.

### AI endpoints (16 verbs + executive-brief + history/samples) under `/api/ai`
launch-window-optimize, weather-window-brief, conjunction-risk, range-safety-assess, fuel-loadout-calc, recovery-plan, anomaly-triage, mission-brief, payload-trajectory-check, ground-systems-checklist, ngs-link-budget, draft-press-release, debris-mitigation-plan, post-flight-narrative, regulatory-compliance-check, executive-brief.

## Gap analysis (categorized)

### AI gaps
- **COVERED** launch-window optimizer (`launch-window-optimize`).
- **COVERED** weather-criteria advisor / LCC (`weather-window-brief`).
- **COVERED** range-safety narrative (`range-safety-assess`) — **NEEDS-PRODUCT-DECISION** (advisory only; not flight-cert).
- **MISSING** payload-integration checklist drafter (distinct from `ground-systems-checklist`) — MECHANICAL.
- **COVERED** debris-risk advisor (`conjunction-risk`, `debris-mitigation-plan`).
- **COVERED** post-launch report (`post-flight-narrative`, `draft-press-release`).

### Non-AI gaps
- **COVERED** launch schedule CRUD (`missions`, `launch-windows`).
- **PARTIAL** hazard-zone polygons (`range-safety-zones` has lat/lng/perimeter_km but no GeoJSON polygon field) — MECHANICAL.
- **COVERED** FAA license tracker (`regulatory-approvals`).
- **MISSING** tenant comms (multi-tenant customer messaging thread) — MECHANICAL.

### Custom-feature gaps
- **PARTIAL** customer multi-launch portfolio mgmt (`customers` + `missions` join exists; no portfolio rollup endpoint) — MECHANICAL.
- **MISSING** sonic-boom forecast (AI verb) — MECHANICAL; **NEEDS-PRODUCT-DECISION** (population-overflight advisory).
- **MISSING** marine-clearance coordinator (NOTMAR/NOTAM workflow) — MECHANICAL; **NEEDS-CREDS** for live USCG feed.

## Safety items flagged NEEDS-PRODUCT-DECISION (advisory only)
- `range-safety-assess` AI output
- Future autonomous FTS / debris-risk go/no-go recommendations
- Sonic-boom population-overflight forecast (if added)

## Status
Audit-only. Counts: 18 CRUD routes, 16 AI verbs + executive-brief, 38 frontend pages. 6 AI domain asks → 5 covered, 1 missing (payload-integration checklist). 4 non-AI asks → 2 covered, 1 partial, 1 missing. 3 custom asks → 1 partial, 2 missing. Backend syntax not re-checked (no edits).

## Apply pass 7 (full backlog implementation)

### Migration
- `backend/migrations/003_apply_pass_7.sql` applied (psql exit 0).
- `range_safety_zones`: added `geojson_polygon JSONB`, `polygon_source`, `polygon_updated_at`.
- New tables: `tenant_comms_threads`, `tenant_comms_messages`, `marine_clearance_notices` (+ indexes).

### New backend endpoints
- AI verbs (mounted via `verbRouteWithSafety` — auto-stamps `advisory_only=true`, `requires_safety_officer_approval=true`, `safety_disclaimer`):
  - `POST /api/ai/payload-integration-checklist` — payload-side integration sequence (distinct from `ground-systems-checklist`).
  - `POST /api/ai/sonic-boom-forecast` — population-overflight advisory (NEEDS-PRODUCT-DECISION).
  - Same safety wrapper retro-applied to `range-safety-assess`, `conjunction-risk`, `debris-mitigation-plan` (range-safety / FTS / debris go-no-go items now advisory only).
  - `GET /api/ai/samples?feature=…` extended with 5 sample fills each.
- Range-safety GeoJSON (advisory only):
  - `GET /api/range-safety-zones/:id/geojson`
  - `PUT /api/range-safety-zones/:id/geojson`
  - `DELETE /api/range-safety-zones/:id/geojson`
- Tenant comms:
  - `GET /api/tenant-comms/templates` — 8 canned templates; safety templates (`range-hold`, `hazard-zone-update`, `debris-conjunction`) flagged `requires_safety_officer_approval=true`.
  - `GET|POST|PUT|DELETE /api/tenant-comms/threads`, `GET /api/tenant-comms/threads/:id`
  - `GET|POST /api/tenant-comms/threads/:thread_id/messages` — POST returns 409 if the chosen template requires safety approval and `safety_officer_approved` is not set.
- Customer portfolio rollup:
  - `GET /api/customer-portfolio` (all customers)
  - `GET /api/customer-portfolio/:customer_id` (per-customer rollup: payloads + missions joined via vehicle_id + regulatory_approvals + anomalies + counters).
- Marine clearance (NOTMAR/NOTAM):
  - `GET|POST /api/marine-clearance`, `GET|PUT|DELETE /api/marine-clearance/:id`
  - `GET /api/marine-clearance/live-uscg` → **503** `{ error: 'uscg_feed_not_configured', needs_creds: true }` (NEEDS-CREDS).
  - `GET /api/marine-clearance/live-faa-notam` → **503** `{ error: 'faa_notam_feed_not_configured', needs_creds: true }` (NEEDS-CREDS).
- All new routes mounted in `backend/server.js` before `app.listen`.

### New frontend pages
- `AIPayloadIntegrationChecklistPage.js` → `/ai/payload-integration-checklist`
- `AISonicBoomForecastPage.js` → `/ai/sonic-boom-forecast`
- `TenantCommsPage.js` → `/tenant-comms` (threads + messages + template picker w/ safety-officer-approval checkbox)
- `CustomerPortfolioPage.js` → `/customer-portfolio` (per-customer rollup with stats + 4 tables)
- `MarineClearancePage.js` → `/marine-clearance` (CRUD + USCG/FAA 503 probe banner)
- Sidebar: new group "Tenant Ops" + entries under "Payloads" / "AI Planning" / "AI Safety".
- API client: `tenantCommsApi`, `customerPortfolioApi`, `marineClearanceApi`, `rangeSafetyZoneGeoJsonApi`, plus `aiPayloadIntegrationChecklist` and `aiSonicBoomForecast`.

### Safety-officer advisory gate
- Output envelope of every range-safety / FTS / debris / sonic-boom AI verb is stamped server-side with `advisory_only: true`, `requires_safety_officer_approval: true`, plus a human-readable `safety_disclaimer`. Applies whether the upstream model populated those fields or not.
- Tenant-comms message POST returns HTTP 409 if a safety-classed canned template is sent without `safety_officer_approved=true`.
- GeoJSON polygon responses echo `requires_safety_officer_approval=true`, `advisory_only=true`.

### Skips
- USCG live NOTMAR feed and FAA NOTAM live feed: **NEEDS-CREDS** — wired to `503` stubs, no third-party HTTP calls made. To enable, set `USCG_API_KEY` and/or `FAA_NOTAM_API_KEY` and replace stub bodies with real fetch logic.

### Verification
- `node --check` clean on every modified backend `.js` (server.js, routes/ai.js, routes/rangeSafetyZones.js, routes/tenantComms.js, routes/customerPortfolio.js, routes/marineClearance.js, services/ai.js).
- Migration applied via `psql -d spaceport_ops -f 003_apply_pass_7.sql` (all `ALTER/CREATE` succeeded).
- No new npm deps. No breaking changes to existing routes (factory-built CRUD on `range_safety_zones` preserved; new geojson sub-routes layered onto same `router.use(crud)` instance).

### Status (pass 7)
Backlog cleared: payload-integration-checklist (MECHANICAL) ✅, hazard-zone GeoJSON (MECHANICAL + advisory) ✅, tenant comms templates (MECHANICAL + advisory) ✅, customer multi-launch portfolio (MECHANICAL) ✅, sonic-boom forecast (MECHANICAL + advisory) ✅, marine clearance CRUD (MECHANICAL) ✅, USCG/FAA live feeds → 503 stubs (NEEDS-CREDS).

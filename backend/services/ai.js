// AI helper service for AISpaceportOps (commercial spaceflight ops).
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  return { key, model };
}

const SYSTEM_PROMPT =
  'You are a senior commercial spaceflight operations analyst supporting a unified spaceport ops ' +
  'center. You provide rigorous, mission-grade reasoning on launch scheduling, range safety, ' +
  'payload management, recovery, weather windows, debris conjunctions and regulatory compliance. ' +
  'Always return strict JSON in the exact schema requested. Never include fenced markdown. ' +
  'Treat every input as a notional tabletop scenario.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve) => {
    const { key, model } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3066',
        'X-Title': 'AI Spaceport Ops',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// 1. Launch Window Optimize
async function launchWindowOptimize(input = {}) {
  const sys = `${SYSTEM_PROMPT} Optimize an instantaneous or extended launch window. Return strict JSON:
{
  "mission": string,
  "vehicle": string,
  "site": string,
  "primary_window": { "opens_at_utc": string, "closes_at_utc": string, "probability_pct": number, "rationale": string },
  "backup_windows": [{ "opens_at_utc": string, "closes_at_utc": string, "probability_pct": number, "rationale": string }],
  "constraints_evaluated": [{ "constraint": string, "status": "ok"|"caution"|"violation", "notes": string }],
  "go_no_go_recommendation": "GO"|"CAUTION"|"NO-GO",
  "summary": string
}`;
  const usr = `Inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', backup_windows: [] });
}

// 2. Weather Window Brief
async function weatherWindowBrief(input = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a launch weather brief. Return strict JSON:
{
  "site": string,
  "valid_at_utc": string,
  "criteria_evaluation": [{ "criterion": string, "value": string, "limit": string, "verdict": "GO"|"CAUTION"|"NO-GO" }],
  "winds_aloft": [{ "fl": string, "kt": number, "dir_deg": number }],
  "convective_risk": "low"|"medium"|"high",
  "trigger_indicators": [string],
  "overall_recommendation": "GO"|"CAUTION"|"NO-GO",
  "summary": string
}`;
  const usr = `Brief inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', criteria_evaluation: [] });
}

// 3. Conjunction Risk
async function conjunctionRisk(input = {}) {
  const sys = `${SYSTEM_PROMPT} Assess on-orbit conjunction risk. Return strict JSON:
{
  "objects": { "primary": string, "secondary": string },
  "miss_distance_km": number,
  "collision_probability": number,
  "tca_utc": string,
  "risk_level": "low"|"medium"|"high"|"critical",
  "recommended_actions": [{ "action": string, "owner": string, "deadline_utc": string }],
  "maneuver_options": [{ "option": string, "delta_v_m_s": number, "fuel_kg": number, "expected_new_miss_km": number }],
  "summary": string
}`;
  const usr = `Conjunction inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recommended_actions: [] });
}

// 4. Range Safety Assess
async function rangeSafetyAssess(input = {}) {
  const sys = `${SYSTEM_PROMPT} Build a range safety assessment for a launch. Return strict JSON:
{
  "mission": string,
  "range": string,
  "hazard_zones": [{ "zone": string, "type": string, "perimeter_km": number, "clear": boolean, "notes": string }],
  "flight_termination": { "system": string, "status": "ok"|"degraded"|"not_ready", "notes": string },
  "third_party_risk": { "Ec": number, "Pc_cas": number, "verdict": "ok"|"marginal"|"violation" },
  "pad_clearance": { "personnel_within_zone": number, "vessels_within_zone": number, "status": "ok"|"caution"|"violation" },
  "go_no_go_recommendation": "GO"|"CAUTION"|"NO-GO",
  "summary": string
}`;
  const usr = `Range safety inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', hazard_zones: [] });
}

// 5. Fuel Loadout Calc
async function fuelLoadoutCalc(input = {}) {
  const sys = `${SYSTEM_PROMPT} Compute fuel & oxidizer loadout for a launch profile. Return strict JSON:
{
  "vehicle": string,
  "mission": string,
  "stage_loads": [{ "stage": string, "propellant": string, "qty_kg": number, "fill_pct": number, "load_duration_min": number }],
  "pressurant_loads": [{ "gas": string, "qty_kg": number }],
  "reserve_required_pct": number,
  "performance_margin_kg": number,
  "feasibility": "ok"|"marginal"|"infeasible",
  "summary": string
}`;
  const usr = `Fuel loadout inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', stage_loads: [] });
}

// 6. Recovery Plan
async function recoveryPlan(input = {}) {
  const sys = `${SYSTEM_PROMPT} Build a recovery plan for a reusable booster or capsule. Return strict JSON:
{
  "vehicle_element": string,
  "recovery_mode": "RTLS"|"ASDS"|"helicopter_snare"|"splashdown"|"other",
  "asset_assignments": [{ "asset_id": string, "type": string, "role": string, "depart_at_utc": string }],
  "timeline": [{ "t_minus_or_plus": string, "event": string }],
  "weather_constraints": [{ "criterion": string, "limit": string }],
  "abort_criteria": [string],
  "summary": string
}`;
  const usr = `Recovery inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', asset_assignments: [] });
}

// 7. Anomaly Triage
async function anomalyTriage(input = {}) {
  const sys = `${SYSTEM_PROMPT} Triage a launch / vehicle anomaly. Return strict JSON:
{
  "anomaly": string,
  "system_affected": string,
  "severity": "low"|"medium"|"high"|"critical",
  "likely_causes": [{ "cause": string, "confidence": number }],
  "investigations_required": [{ "action": string, "owner": string, "eta_hours": number }],
  "launch_impact": { "go_no_go": "GO"|"HOLD"|"NO-GO", "delay_days": number, "rationale": string },
  "summary": string
}`;
  const usr = `Anomaly inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', likely_causes: [] });
}

// 8. Mission Brief
async function missionBrief(input = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a pre-launch mission brief. Return strict JSON:
{
  "mission": string,
  "vehicle": string,
  "customer": string,
  "payload_summary": string,
  "target_orbit": string,
  "launch_site": string,
  "key_milestones": [{ "t_minus": string, "event": string }],
  "risks": [{ "risk": string, "severity": "low"|"medium"|"high", "mitigation": string }],
  "success_criteria": [string],
  "summary": string
}`;
  const usr = `Mission brief inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', key_milestones: [] });
}

// 9. Executive Brief
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a spaceport executive operational brief. Return strict JSON:
{
  "headline": string,
  "manifest_overview": string,
  "range_readiness": { "ready_pct": number, "narrative": string },
  "active_missions": [{ "mission": string, "status": string, "notes": string }],
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "options": [string], "recommendation": string }],
  "next_24h_outlook": string,
  "summary": string
}`;
  const usr = `Operational snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', top_risks: [] });
}

// 10. Payload Trajectory Check
async function payloadTrajectoryCheck(input = {}) {
  const sys = `${SYSTEM_PROMPT} Verify a payload trajectory against vehicle performance and orbit insertion targets. Return strict JSON:
{
  "payload": string,
  "vehicle": string,
  "target_orbit": string,
  "insertion_check": { "apogee_km": number, "perigee_km": number, "inclination_deg": number, "raan_deg": number, "within_tolerance": boolean },
  "delta_v_budget": { "required_m_s": number, "available_m_s": number, "margin_m_s": number },
  "mass_margin_kg": number,
  "feasibility": "ok"|"marginal"|"infeasible",
  "issues": [string],
  "summary": string
}`;
  const usr = `Trajectory inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', issues: [] });
}

// 11. Ground Systems Checklist
async function groundSystemsChecklist(input = {}) {
  const sys = `${SYSTEM_PROMPT} Generate a ground-systems readiness checklist for a launch. Return strict JSON:
{
  "site": string,
  "mission": string,
  "items": [{ "system": string, "check": string, "status": "go"|"caution"|"no_go", "owner": string, "due_t_minus": string }],
  "blockers": [{ "system": string, "issue": string, "eta_hours": number }],
  "overall_readiness_pct": number,
  "go_for_terminal_count": boolean,
  "summary": string
}`;
  const usr = `Checklist inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', items: [] });
}

// 12. NGS Link Budget
async function ngsLinkBudget(input = {}) {
  const sys = `${SYSTEM_PROMPT} Compute a ground-station / TT&C link budget for a mission. Return strict JSON:
{
  "mission": string,
  "station": string,
  "band": string,
  "freq_mhz": number,
  "eirp_dbw": number,
  "free_space_loss_db": number,
  "atmospheric_loss_db": number,
  "rain_margin_db": number,
  "g_over_t_db_K": number,
  "received_c_n0_dbHz": number,
  "link_margin_db": number,
  "verdict": "closed"|"marginal"|"unable",
  "summary": string
}`;
  const usr = `Link budget inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// 13. Draft Press Release
async function draftPressRelease(input = {}) {
  const sys = `${SYSTEM_PROMPT} Draft a public-facing press release for a launch event. Return strict JSON:
{
  "headline": string,
  "subhead": string,
  "dateline": string,
  "body_paragraphs": [string],
  "customer_quote": string,
  "spaceport_quote": string,
  "key_facts": [{ "label": string, "value": string }],
  "summary": string
}`;
  const usr = `Press release inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', body_paragraphs: [] });
}

// 14. Debris Mitigation Plan
async function debrisMitigationPlan(input = {}) {
  const sys = `${SYSTEM_PROMPT} Build a debris mitigation plan compliant with FCC / FAA / ISO 24113. Return strict JSON:
{
  "mission": string,
  "vehicle_or_payload": string,
  "post_mission_disposal": { "mode": string, "lifetime_years": number, "compliant": boolean },
  "passivation_steps": [string],
  "casualty_risk_estimate": number,
  "tracking_obligations": [string],
  "collision_avoidance_capability": string,
  "compliance_check": [{ "standard": string, "status": "compliant"|"non_compliant"|"unknown", "notes": string }],
  "summary": string
}`;
  const usr = `Debris mitigation inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', passivation_steps: [] });
}

// 15. Post-Flight Narrative
async function postFlightNarrative(input = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a post-flight narrative report. Return strict JSON:
{
  "mission": string,
  "outcome": "success"|"partial"|"failure"|"scrub",
  "timeline_highlights": [{ "t_plus": string, "event": string }],
  "key_metrics": [{ "metric": string, "value": string, "target": string }],
  "anomalies_observed": [{ "system": string, "severity": "low"|"medium"|"high"|"critical", "summary": string }],
  "lessons_learned": [string],
  "follow_on_actions": [{ "action": string, "owner": string, "due": string }],
  "summary": string
}`;
  const usr = `Post-flight inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', anomalies_observed: [] });
}

// 16. Regulatory Compliance Check
async function regulatoryComplianceCheck(input = {}) {
  const sys = `${SYSTEM_PROMPT} Audit a mission for regulatory and licensing compliance. Return strict JSON:
{
  "mission": string,
  "authority_reviews": [{ "authority": string, "approval_type": string, "status": "approved"|"pending"|"missing", "issued_at": string, "notes": string }],
  "missing_documents": [string],
  "filing_deadlines": [{ "filing": string, "due_utc": string }],
  "overall_compliance": "compliant"|"partial"|"non_compliant",
  "recommended_actions": [{ "action": string, "owner": string, "deadline_utc": string }],
  "summary": string
}`;
  const usr = `Compliance inputs:\n${JSON.stringify(input, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', authority_reviews: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  launchWindowOptimize,
  weatherWindowBrief,
  conjunctionRisk,
  rangeSafetyAssess,
  fuelLoadoutCalc,
  recoveryPlan,
  anomalyTriage,
  missionBrief,
  executiveBrief,
  payloadTrajectoryCheck,
  groundSystemsChecklist,
  ngsLinkBudget,
  draftPressRelease,
  debrisMitigationPlan,
  postFlightNarrative,
  regulatoryComplianceCheck,
};

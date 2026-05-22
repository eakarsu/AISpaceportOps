const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────
// Sample fills — 5 realistic spaceport scenarios per feature
// ──────────────────────────────────────────────
const SAMPLES = {
  'launch-window-optimize': [
    { label: 'Falcon 9 / GTO / Cape Canaveral / scrubbed Tuesday',
      values: { mission: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5', site: 'CCSFS SLC-40', target_orbit: 'LEO 780km/86.4°', constraints: 'Range available; weather marginal Tue; backup Wed/Thu; sun-angle on payload limits to a 17-min instantaneous window.' } },
    { label: 'Vulcan Centaur / NROL-114 / 4-hour window',
      values: { mission: 'NROL-114', vehicle: 'Vulcan Centaur VC2S', site: 'CCSFS SLC-41', target_orbit: 'GTO', constraints: 'Classified payload; 4-hour evening window 22:00-02:00 UTC.' } },
    { label: 'Ariane 6 / Galileo L13 / Kourou ELA-4',
      values: { mission: 'GALILEO L13', vehicle: 'Ariane 6 A64', site: 'CSG Kourou ELA-4', target_orbit: 'MEO 23222 km / 56°', constraints: 'Trade winds nominal; 90-min window.' } },
    { label: 'Electron / Flock-25 / Mahia / SSO',
      values: { mission: 'PLANET FLOCK-25', vehicle: 'Electron', site: 'Mahia Peninsula RL-1 Pad B', target_orbit: 'SSO 500km/97.4°', constraints: 'Mid-latitude site; tight 18-min instantaneous window.' } },
    { label: 'Falcon Heavy / Lightspeed-1 / GEO',
      values: { mission: 'TELESAT LIGHTSPEED-1', vehicle: 'Falcon Heavy', site: 'KSC LC-39A', target_orbit: 'GEO', constraints: 'GEO direct insertion; expendable side-boosters; 4-hour window.' } },
  ],

  'weather-window-brief': [
    { label: 'CCSFS / Falcon 9 / NOAA-rules',
      values: { site: 'CCSFS SLC-40', valid_at_utc: '2026-05-22 04:00Z', vehicle: 'Falcon 9', criteria: 'NASA Launch Commit Criteria — anvil clouds, surface winds 25kt limit, upper-level shear <50 kt across 0-50 kft.' } },
    { label: 'VSFB / Electron / dawn launch',
      values: { site: 'VSFB SLC-4E', valid_at_utc: '2026-06-02 12:42Z', vehicle: 'Falcon 9', criteria: 'Pacific marine layer ceiling 1000 ft; 18 kt surface winds; gusts to 24 kt.' } },
    { label: 'Kourou / Ariane 6 / trade winds',
      values: { site: 'CSG Kourou ELA-4', valid_at_utc: '2026-06-10 18:00Z', vehicle: 'Ariane 6', criteria: 'Equatorial; trade winds 09 kt; no convective activity within 20 nm.' } },
    { label: 'Mahia / Electron / coastal',
      values: { site: 'Mahia Peninsula RL-1', valid_at_utc: '2026-06-04 23:00Z', vehicle: 'Electron', criteria: 'Coastal southerly 22 kt gusting 28; marine layer 3800 ft.' } },
    { label: 'Boca Chica / Starship / summer',
      values: { site: 'Starbase Boca Chica', valid_at_utc: '2026-06-15 12:00Z', vehicle: 'Starship', criteria: 'Sea breeze convergence afternoon; surface winds 10 kt; isolated cumulus.' } },
  ],

  'conjunction-risk': [
    { label: 'Conjunction with debris from Cosmos 1408, TCA 12h',
      values: { primary: 'STARLINK-3219', secondary: 'COSMOS 1408 DEB', miss_distance_km: 0.412, probability: 0.000210, tca_utc: '2026-05-22 05:18Z' } },
    { label: 'ONEWEB-0567 vs Cosmos 1408 debris, Pc 4.5e-4',
      values: { primary: 'ONEWEB-0567', secondary: 'COSMOS 1408 DEB', miss_distance_km: 0.310, probability: 0.000450, tca_utc: '2026-06-02 14:00Z' } },
    { label: 'Crew Dragon Endeavour vs Starlink',
      values: { primary: 'CREW DRAGON ENDEAVOUR', secondary: 'STARLINK-2007', miss_distance_km: 3.46, probability: 0.000009, tca_utc: '2026-05-25 03:42Z' } },
    { label: 'ISS proximity — Cosmos 2251 debris',
      values: { primary: 'ISS', secondary: 'COSMOS 2251 DEB', miss_distance_km: 2.88, probability: 0.000012, tca_utc: '2026-05-23 18:05Z' } },
    { label: 'WorldView Legion 3 vs Fengyun debris',
      values: { primary: 'WORLDVIEW LEGION 3', secondary: 'FENGYUN 1C DEB', miss_distance_km: 0.78, probability: 0.000101, tca_utc: '2026-05-29 18:48Z' } },
  ],

  'range-safety-assess': [
    { label: 'Falcon 9 / SLC-40 / Atlantic exclusion',
      values: { mission: 'IRIDIUM NEXT-9', range: 'Eastern Range (CCSFS)', vehicle: 'Falcon 9', flight_termination: 'Autonomous FTS', notes: 'Standard maritime exclusion 35 km; airspace TFR 90 km.' } },
    { label: 'Vulcan / SLC-41 / NROL classified',
      values: { mission: 'NROL-114', range: 'Eastern Range (CCSFS)', vehicle: 'Vulcan Centaur', flight_termination: 'Autonomous FTS', notes: 'Northern dogleg; classified IIP.' } },
    { label: 'Ariane 6 / Kourou coastal sterile',
      values: { mission: 'GALILEO L13', range: 'CSG Kourou', vehicle: 'Ariane 6', flight_termination: 'Command FTS', notes: 'Coastal sterile 8 km; trade-winds dispersal.' } },
    { label: 'Electron / Mahia / coastal',
      values: { mission: 'PLANET FLOCK-25', range: 'Mahia Peninsula RL-1', vehicle: 'Electron', flight_termination: 'Autonomous FTS', notes: 'Small coastal zone; minimal third-party population.' } },
    { label: 'Starship / Boca Chica / unique hazards',
      values: { mission: 'Starship V2 Flight Test', range: 'Starbase', vehicle: 'Starship', flight_termination: 'Autonomous FTS (super heavy)', notes: 'Beach evacuation; methane leak procedures pre-launch.' } },
  ],

  'fuel-loadout-calc': [
    { label: 'Falcon 9 GTO loadout / RP-1 + LOX',
      values: { vehicle: 'Falcon 9 Block 5', mission: 'GTO 2100kg', payload_mass_kg: 2100, target_orbit: 'GTO' } },
    { label: 'Vulcan Centaur to GTO',
      values: { vehicle: 'Vulcan Centaur VC2S', mission: 'NROL-114', payload_mass_kg: 2100, target_orbit: 'GTO' } },
    { label: 'Ariane 6 A64 to MEO Galileo',
      values: { vehicle: 'Ariane 6 A64', mission: 'GALILEO L13', payload_mass_kg: 4200, target_orbit: 'MEO 23222km/56°' } },
    { label: 'Electron Curie to SSO',
      values: { vehicle: 'Electron', mission: 'PLANET FLOCK-25', payload_mass_kg: 4, target_orbit: 'SSO 500km/97.4°' } },
    { label: 'Falcon Heavy expendable to GEO',
      values: { vehicle: 'Falcon Heavy', mission: 'LIGHTSPEED-1', payload_mass_kg: 4700, target_orbit: 'GEO direct' } },
  ],

  'recovery-plan': [
    { label: 'Recovery downrange, drone ship Pacific',
      values: { vehicle_element: 'Falcon 9 first stage', recovery_mode: 'ASDS', notes: 'Pacific drone ship 600 km downrange from VSFB.' } },
    { label: 'RTLS at LZ-1 CCSFS',
      values: { vehicle_element: 'Falcon 9 first stage', recovery_mode: 'RTLS', notes: 'Return to launch site at LZ-1 Cape Canaveral after boost-back burn.' } },
    { label: 'Helicopter air-snare — Electron at Mahia',
      values: { vehicle_element: 'Electron first stage', recovery_mode: 'helicopter_snare', notes: 'Helicopter snare in Mahia downrange recovery area.' } },
    { label: 'Crew Dragon splashdown — Atlantic',
      values: { vehicle_element: 'Crew Dragon capsule', recovery_mode: 'splashdown', notes: 'Crew Dragon Endeavour splashdown off Florida coast.' } },
    { label: 'New Glenn first stage on LZ-1 KSC',
      values: { vehicle_element: 'New Glenn first stage', recovery_mode: 'ASDS', notes: 'Downrange landing on Blue Origin recovery ship Jacklyn.' } },
  ],

  'anomaly-triage': [
    { label: 'H3 SRB-3 igniter charge anomaly',
      values: { anomaly: 'H3 SRB-3 igniter charge low resistance reading', system: 'SRB-3 igniter', context: 'Detected during T-30 hr pad test.' } },
    { label: 'Centaur LH2 pre-press valve sticking',
      values: { anomaly: 'Centaur LH2 pre-press valve sticking', system: 'Centaur LH2 pre-press', context: 'Two cycles required during tanking simulation.' } },
    { label: 'Falcon Heavy side booster B1 wear',
      values: { anomaly: 'Side booster B1 grid fin actuator wear marks', system: 'Grid fin actuator', context: '12th flight; visual inspection post-recovery.' } },
    { label: 'New Glenn BE-4 #4 chill anomaly',
      values: { anomaly: 'BE-4 #4 LOX inlet chill profile out of family', system: 'BE-4 engine #4', context: 'T-90 min pre-chill; consider warm engine launch.' } },
    { label: 'Crew Dragon ECLSS sensor drift',
      values: { anomaly: 'ECLSS CO2 sensor channel A drift', system: 'ECLSS', context: 'Crewed mission AX-5; channel B nominal.' } },
  ],

  'mission-brief': [
    { label: 'Iridium NEXT-9 batch — Falcon 9',
      values: { mission: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5', customer: 'Iridium Communications', target_orbit: 'LEO 780km/86.4°', site: 'CCSFS SLC-40' } },
    { label: 'Galileo L13 — Ariane 6',
      values: { mission: 'GALILEO L13', vehicle: 'Ariane 6 A64', customer: 'European Space Agency', target_orbit: 'MEO 23222km/56°', site: 'CSG Kourou ELA-4' } },
    { label: 'OneWeb-22 — Falcon 9',
      values: { mission: 'ONEWEB-22', vehicle: 'Falcon 9 Block 5', customer: 'OneWeb', target_orbit: 'LEO 1200km/87.9°', site: 'VSFB SLC-4E' } },
    { label: 'NROL-114 — Vulcan',
      values: { mission: 'NROL-114', vehicle: 'Vulcan Centaur VC2S', customer: 'NRO', target_orbit: 'GTO', site: 'CCSFS SLC-41' } },
    { label: 'AX-5 crewed — Falcon 9 + Dragon',
      values: { mission: 'AX-5 CREW', vehicle: 'Falcon 9 + Crew Dragon', customer: 'Axiom Space', target_orbit: 'LEO 415km/51.6° (ISS rendezvous)', site: 'KSC LC-39A' } },
  ],

  'executive-brief': [
    { label: 'Default snapshot',                values: { notes: '' } },
    { label: 'Bias toward Falcon 9 manifest',   values: { notes: 'Bias the brief toward the SpaceX Falcon 9 cadence and recovery posture across CCSFS and VSFB.' } },
    { label: 'Bias toward range conflicts',     values: { notes: 'Focus on Eastern Range slot contention between SLC-40, SLC-41 and LC-39A across the next 21 days.' } },
    { label: 'Bias toward crewed posture',      values: { notes: 'Bias toward crewed mission readiness — AX-5 and Crew Dragon ECLSS anomaly tracking.' } },
    { label: 'Bias toward customer revenue',    values: { notes: 'Bias toward customer-facing revenue posture: integrated payloads, scrubbed missions, refund exposure.' } },
  ],

  'payload-trajectory-check': [
    { label: 'Iridium NEXT-9 to LEO',
      values: { payload: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5', target_orbit: 'LEO 780km/86.4°', payload_mass_kg: 860 } },
    { label: 'Galileo L13 to MEO direct',
      values: { payload: 'GALILEO L13', vehicle: 'Ariane 6 A64', target_orbit: 'MEO 23222km/56°', payload_mass_kg: 4200 } },
    { label: 'Lightspeed-1 to GEO direct',
      values: { payload: 'TELESAT LIGHTSPEED-1', vehicle: 'Falcon Heavy', target_orbit: 'GEO', payload_mass_kg: 4700 } },
    { label: 'Astranis Arcturus-2 to GEO',
      values: { payload: 'ASTRANIS ARCTURUS-2', vehicle: 'Falcon 9 Block 5', target_orbit: 'GEO via apogee burn', payload_mass_kg: 400 } },
    { label: 'NROL-114 to GTO',
      values: { payload: 'NROL-114', vehicle: 'Vulcan Centaur VC2S', target_orbit: 'GTO', payload_mass_kg: 2100 } },
  ],

  'ground-systems-checklist': [
    { label: 'SLC-40 / Falcon 9 / Iridium-9',
      values: { site: 'CCSFS SLC-40', mission: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5' } },
    { label: 'LC-39A / Falcon Heavy / Lightspeed',
      values: { site: 'KSC LC-39A', mission: 'TELESAT LIGHTSPEED-1', vehicle: 'Falcon Heavy' } },
    { label: 'SLC-41 / Vulcan / NROL-114',
      values: { site: 'CCSFS SLC-41', mission: 'NROL-114', vehicle: 'Vulcan Centaur' } },
    { label: 'ELA-4 / Ariane 6 / Galileo L13',
      values: { site: 'CSG Kourou ELA-4', mission: 'GALILEO L13', vehicle: 'Ariane 6 A64' } },
    { label: 'Mahia Pad B / Electron / Flock-25',
      values: { site: 'Mahia Peninsula RL-1 Pad B', mission: 'PLANET FLOCK-25', vehicle: 'Electron' } },
  ],

  'ngs-link-budget': [
    { label: 'S-band TT&C from Antigua TT&C',
      values: { mission: 'IRIDIUM NEXT-9', station: 'Antigua TT&C', band: 'S', freq_mhz: 2272.5, antenna_diameter_m: 13, eirp_dbw: 38 } },
    { label: 'X-band downlink Kourou',
      values: { mission: 'GALILEO L13', station: 'Kourou DSN', band: 'X', freq_mhz: 8425, antenna_diameter_m: 13, eirp_dbw: 47 } },
    { label: 'C-band Tanegashima',
      values: { mission: 'HTV-X3', station: 'Tanegashima C', band: 'C', freq_mhz: 5800, antenna_diameter_m: 11, eirp_dbw: 42 } },
    { label: 'L-band MUOS UHF',
      values: { mission: 'AX-5 CREW', station: 'KSC Hangar TT&C', band: 'L', freq_mhz: 1670, antenna_diameter_m: 7, eirp_dbw: 30 } },
    { label: 'Ka-band high-rate from KSC TEL',
      values: { mission: 'TELESAT LIGHTSPEED-1', station: 'KSC TEL-2', band: 'Ka', freq_mhz: 27500, antenna_diameter_m: 9, eirp_dbw: 55 } },
  ],

  'draft-press-release': [
    { label: 'Successful Iridium NEXT-9 launch',
      values: { mission: 'IRIDIUM NEXT-9', customer: 'Iridium Communications', vehicle: 'Falcon 9 Block 5', outcome: 'success', notes: 'Deployed 10 satellites to 780km / 86.4°.' } },
    { label: 'Galileo L13 satellites operational',
      values: { mission: 'GALILEO L13', customer: 'European Space Agency', vehicle: 'Ariane 6 A64', outcome: 'success', notes: 'Both Galileo satellites entered MEO checkout.' } },
    { label: 'AX-5 crewed mission lift-off',
      values: { mission: 'AX-5 CREW', customer: 'Axiom Space', vehicle: 'Falcon 9 + Crew Dragon', outcome: 'success', notes: '4-person commercial crew bound for ISS.' } },
    { label: 'Maxar WV-Legion-3 scrub announcement',
      values: { mission: 'MAXAR WORLDVIEW-LEGION-3', customer: 'Maxar Technologies', vehicle: 'Falcon 9', outcome: 'scrub', notes: 'Upper-level winds violated launch commit criteria.' } },
    { label: 'Electron Flock-25 recovery success',
      values: { mission: 'PLANET FLOCK-25', customer: 'Planet Labs', vehicle: 'Electron', outcome: 'success', notes: 'First-stage recovered via helicopter air-snare.' } },
  ],

  'debris-mitigation-plan': [
    { label: 'OneWeb Gen-2 disposal plan',
      values: { mission: 'ONEWEB-22', vehicle_or_payload: 'OneWeb Gen-2 satellites', constellation: 'OneWeb Gen-2', operating_alt_km: 1200, disposal_mode: 'controlled de-orbit at EOL' } },
    { label: 'Starlink V3 batch',
      values: { mission: 'STARLINK V3', vehicle_or_payload: 'Starlink V3 satellites', constellation: 'Starlink', operating_alt_km: 540, disposal_mode: 'natural decay <5 years' } },
    { label: 'Galileo MEO long-term',
      values: { mission: 'GALILEO L13', vehicle_or_payload: 'Galileo satellites', constellation: 'Galileo MEO', operating_alt_km: 23222, disposal_mode: 'graveyard orbit' } },
    { label: 'Iridium NEXT EOL plan',
      values: { mission: 'IRIDIUM NEXT-9', vehicle_or_payload: 'Iridium NEXT satellites', constellation: 'Iridium NEXT', operating_alt_km: 780, disposal_mode: 'controlled de-orbit <25 years' } },
    { label: 'Astranis GEO disposal',
      values: { mission: 'ASTRANIS ARCTURUS-2', vehicle_or_payload: 'Astranis GEO microsat', constellation: null, operating_alt_km: 35786, disposal_mode: 'graveyard orbit +300 km' } },
  ],

  'post-flight-narrative': [
    { label: 'Iridium NEXT-9 nominal',
      values: { mission: 'IRIDIUM NEXT-9', outcome: 'success', summary_input: 'Nominal ascent; payloads deployed within 0.01% of target.' } },
    { label: 'WorldView-Legion-3 scrub',
      values: { mission: 'MAXAR WORLDVIEW-LEGION-3', outcome: 'scrub', summary_input: 'Scrubbed at T-12 due to upper-level winds 31 kt.' } },
    { label: 'Electron Flock-25 recovered',
      values: { mission: 'PLANET FLOCK-25', outcome: 'success', summary_input: 'Helicopter air-snare achieved; payloads deployed nominally.' } },
    { label: 'H3 #24L delayed by anomaly',
      values: { mission: 'HTV-X3', outcome: 'partial', summary_input: 'SRB-3 igniter charge anomaly forced 14-day stand-down.' } },
    { label: 'AX-5 crewed mission summary',
      values: { mission: 'AX-5 CREW', outcome: 'success', summary_input: 'Crew Dragon performed nominal ISS rendezvous and docking.' } },
  ],

  'regulatory-compliance-check': [
    { label: 'OneWeb-22 — FAA license pending',
      values: { mission: 'ONEWEB-22', vehicle: 'Falcon 9', customer: 'OneWeb', authority: 'FAA AST', context: 'License application under review; ITU coordination complete.' } },
    { label: 'NROL-114 — full classified workflow',
      values: { mission: 'NROL-114', vehicle: 'Vulcan Centaur', customer: 'NRO', authority: 'FAA AST + DoD', context: 'Classified mission; secure environmental review process.' } },
    { label: 'Galileo L13 — ESA / CNES',
      values: { mission: 'GALILEO L13', vehicle: 'Ariane 6', customer: 'ESA', authority: 'CNES + ESA', context: 'European launch — French national licensing.' } },
    { label: 'AX-5 — crewed authorization',
      values: { mission: 'AX-5 CREW', vehicle: 'Falcon 9 + Crew Dragon', customer: 'Axiom Space', authority: 'FAA AST + NASA', context: 'Crewed spaceflight authorization required.' } },
    { label: 'Electron Flock-25 — NZ MoT',
      values: { mission: 'PLANET FLOCK-25', vehicle: 'Electron', customer: 'Planet Labs', authority: 'New Zealand MoT', context: 'NZ launch permit; debris mitigation review.' } },
  ],

  // Apply pass 7 — new advisory-only verbs
  'payload-integration-checklist': [
    { label: 'Iridium NEXT-9 / Falcon 9 / SLC-40',
      values: { payload: 'IRIDIUM NEXT-9', mission: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5', integration_site: 'CCSFS SLC-40 PIF', t_minus_window: 'L-21d to L-3d', notes: 'Encapsulation L-10d; mate to PA L-7d; transport to pad L-3d.' } },
    { label: 'Galileo L13 / Ariane 6 / BAF Kourou',
      values: { payload: 'GALILEO L13', mission: 'GALILEO L13', vehicle: 'Ariane 6 A64', integration_site: 'BAF Kourou', t_minus_window: 'L-30d to L-2d', notes: 'Dual-payload dispenser; ESA contamination class 100k.' } },
    { label: 'AX-5 Crew Dragon / KSC LC-39A',
      values: { payload: 'AX-5 CREW DRAGON', mission: 'AX-5 CREW', vehicle: 'Falcon 9 + Crew Dragon', integration_site: 'KSC HIF', t_minus_window: 'L-14d to L-1d', notes: 'Crewed integration — additional ECLSS, suit-mate, emergency egress checks.' } },
    { label: 'Lightspeed-1 / Falcon Heavy / LC-39A',
      values: { payload: 'TELESAT LIGHTSPEED-1', mission: 'TELESAT LIGHTSPEED-1', vehicle: 'Falcon Heavy', integration_site: 'KSC HIF', t_minus_window: 'L-21d to L-3d', notes: 'Heavy fairing; long-duration battery conditioning required.' } },
    { label: 'Electron Flock-25 / Mahia',
      values: { payload: 'PLANET FLOCK-25', mission: 'PLANET FLOCK-25', vehicle: 'Electron', integration_site: 'Mahia ICF', t_minus_window: 'L-10d to L-1d', notes: '36 cubesats on Electron kick stage; dispenser sequencing critical.' } },
  ],

  'sonic-boom-forecast': [
    { label: 'Falcon 9 RTLS LZ-1 / Cape',
      values: { mission: 'IRIDIUM NEXT-9', vehicle: 'Falcon 9 Block 5', phase: 'booster_return', trajectory_notes: 'RTLS to LZ-1; boost-back through Bermuda High; surface winds 12 kt SW.' } },
    { label: 'Starship reentry over Boca Chica',
      values: { mission: 'Starship V2 Flight Test', vehicle: 'Starship', phase: 'reentry', trajectory_notes: 'High-AoA reentry; carpet width up to 40 km over coastal South Texas.' } },
    { label: 'Falcon Heavy side-booster RTLS pair',
      values: { mission: 'LIGHTSPEED-1', vehicle: 'Falcon Heavy', phase: 'booster_return', trajectory_notes: 'Twin RTLS at LZ-1 / LZ-2; double sonic boom over central Brevard County.' } },
    { label: 'Electron descent Mahia',
      values: { mission: 'PLANET FLOCK-25', vehicle: 'Electron', phase: 'reentry', trajectory_notes: 'Smaller booster; carpet over Pacific 250 km E of NZ coast.' } },
    { label: 'Vulcan ascent Eastern Range',
      values: { mission: 'NROL-114', vehicle: 'Vulcan Centaur', phase: 'ascent', trajectory_notes: 'SRB separation overpressure; Atlantic offshore corridor.' } },
  ],
};

// GET /api/ai/samples?feature=<verb>
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) {
      return res.json({ features: Object.keys(SAMPLES) });
    }
    const samples = SAMPLES[feature];
    if (!samples) {
      return res.status(404).json({ error: `unknown feature: ${feature}` });
    }
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history?feature=<name>&limit=<n>
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Helper to register a simple verb endpoint
function verbRoute(name, fn) {
  router.post(`/${name}`, async (req, res) => {
    try {
      const input = req.body || {};
      const result = await fn(input);
      await record(name, input, result);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

// Safety-officer advisory gate. Any AI verb whose output drives a
// range-safety / FTS / debris go/no-go decision must be flagged
// advisory_only=true and requires_safety_officer_approval=true on the
// output envelope. The safe wrapper is applied after the verb returns.
const SAFETY_ADVISORY_VERBS = new Set([
  'range-safety-assess',
  'conjunction-risk',
  'debris-mitigation-plan',
  'payload-integration-checklist',
  'sonic-boom-forecast',
]);

function verbRouteWithSafety(name, fn) {
  router.post(`/${name}`, async (req, res) => {
    try {
      const input = req.body || {};
      const result = await fn(input);
      if (SAFETY_ADVISORY_VERBS.has(name) && result && typeof result === 'object') {
        result.advisory_only = true;
        result.requires_safety_officer_approval = true;
        result.safety_disclaimer =
          'AI output is advisory only. Operational range-safety, FTS, and ' +
          'debris go/no-go decisions require explicit safety officer sign-off.';
      }
      await record(name, input, result);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
}

verbRouteWithSafety('launch-window-optimize',     ai.launchWindowOptimize);
verbRouteWithSafety('weather-window-brief',       ai.weatherWindowBrief);
verbRouteWithSafety('conjunction-risk',           ai.conjunctionRisk);
verbRouteWithSafety('range-safety-assess',        ai.rangeSafetyAssess);
verbRouteWithSafety('fuel-loadout-calc',          ai.fuelLoadoutCalc);
verbRouteWithSafety('recovery-plan',              ai.recoveryPlan);
verbRouteWithSafety('anomaly-triage',             ai.anomalyTriage);
verbRouteWithSafety('mission-brief',              ai.missionBrief);
verbRouteWithSafety('payload-trajectory-check',   ai.payloadTrajectoryCheck);
verbRouteWithSafety('ground-systems-checklist',   ai.groundSystemsChecklist);
verbRouteWithSafety('ngs-link-budget',            ai.ngsLinkBudget);
verbRouteWithSafety('draft-press-release',        ai.draftPressRelease);
verbRouteWithSafety('debris-mitigation-plan',     ai.debrisMitigationPlan);
verbRouteWithSafety('post-flight-narrative',      ai.postFlightNarrative);
verbRouteWithSafety('regulatory-compliance-check',ai.regulatoryComplianceCheck);

// Apply pass 7 — new advisory-only verbs
verbRouteWithSafety('payload-integration-checklist', ai.payloadIntegrationChecklist);
verbRouteWithSafety('sonic-boom-forecast',           ai.sonicBoomForecast);

// executive-brief: includes DB snapshot
router.post('/executive-brief', async (req, res) => {
  try {
    const [missions, payloads, anomalies, conj, weather] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='scrubbed') AS scrubbed, COUNT(*) AS total FROM missions"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='integrated') AS integrated, COUNT(*) FILTER (WHERE status='flight_ready') AS flight_ready, COUNT(*) AS total FROM payloads"),
      pool.query("SELECT COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high, COUNT(*) FILTER (WHERE status='open') AS open_count, COUNT(*) AS total FROM anomalies"),
      pool.query("SELECT COUNT(*) FILTER (WHERE probability>=0.0001) AS high_pc, COUNT(*) AS total FROM debris_conjunctions"),
      pool.query("SELECT COUNT(*) FILTER (WHERE recommendation='GO') AS go_count, COUNT(*) FILTER (WHERE recommendation='NO-GO') AS no_go, COUNT(*) AS total FROM weather_briefs"),
    ]);
    const snapshot = {
      missions: missions.rows[0],
      payloads: payloads.rows[0],
      anomalies: anomalies.rows[0],
      debris_conjunctions: conj.rows[0],
      weather: weather.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const brief = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

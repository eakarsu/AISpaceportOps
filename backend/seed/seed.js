const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'spaceport_ops',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS launch_vehicles      CASCADE;
      DROP TABLE IF EXISTS payloads             CASCADE;
      DROP TABLE IF EXISTS customers            CASCADE;
      DROP TABLE IF EXISTS missions             CASCADE;
      DROP TABLE IF EXISTS launch_windows       CASCADE;
      DROP TABLE IF EXISTS range_assignments    CASCADE;
      DROP TABLE IF EXISTS range_safety_zones   CASCADE;
      DROP TABLE IF EXISTS weather_briefs       CASCADE;
      DROP TABLE IF EXISTS recovery_assets      CASCADE;
      DROP TABLE IF EXISTS fuel_inventory       CASCADE;
      DROP TABLE IF EXISTS ground_systems       CASCADE;
      DROP TABLE IF EXISTS telemetry            CASCADE;
      DROP TABLE IF EXISTS anomalies            CASCADE;
      DROP TABLE IF EXISTS debris_conjunctions  CASCADE;
      DROP TABLE IF EXISTS comms_links          CASCADE;
      DROP TABLE IF EXISTS regulatory_approvals CASCADE;
      DROP TABLE IF EXISTS post_flight_reports  CASCADE;
      DROP TABLE IF EXISTS audit_log            CASCADE;
      DROP TABLE IF EXISTS ai_results           CASCADE;

      DROP TABLE IF EXISTS users                CASCADE;
      DROP TABLE IF EXISTS notifications        CASCADE;
      DROP TABLE IF EXISTS attachments          CASCADE;
      DROP TABLE IF EXISTS webhooks             CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries   CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema1 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema1);
    const schema2 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '002_schema.sql'), 'utf8');
    await client.query(schema2);

    console.log('[seed] inserting launch_vehicles...');
    const vehicles = [
      ['LV-FH9B5',  'SpaceX',           'Falcon 9',         'Block 5',    true,  'available'],
      ['LV-FH9HV',  'SpaceX',           'Falcon Heavy',     'Block 5',    true,  'available'],
      ['LV-STAR2',  'SpaceX',           'Starship',         'V2',         true,  'flight_test'],
      ['LV-ELN4',   'Rocket Lab',       'Electron',         'Curie kick', true,  'available'],
      ['LV-NEU01',  'Rocket Lab',       'Neutron',          'Block 1',    true,  'development'],
      ['LV-VUL01',  'United Launch',    'Vulcan Centaur',   'VC2S',       false, 'available'],
      ['LV-ATL5',   'United Launch',    'Atlas V',          '551',        false, 'retiring'],
      ['LV-NGL01',  'Blue Origin',      'New Glenn',        'Block 1',    true,  'available'],
      ['LV-NSH01',  'Blue Origin',      'New Shepard',      'NS-4',       true,  'available'],
      ['LV-ARI6',   'ArianeGroup',      'Ariane 6',         'A64',        false, 'available'],
      ['LV-H3',     'JAXA/Mitsubishi',  'H3',               '24L',        false, 'available'],
      ['LV-LM9',    'CASC',             'Long March 9',     'CZ-9',       true,  'development'],
      ['LV-SOY2',   'Roscosmos',        'Soyuz-2',          '1b',         false, 'restricted'],
      ['LV-FIR01',  'Firefly',          'Alpha',            'Block 2',    false, 'available'],
      ['LV-TER1',   'Relativity',       'Terran R',         'Block 1',    true,  'development'],
    ];
    for (const v of vehicles) {
      await client.query(
        `INSERT INTO launch_vehicles (vehicle_id,vendor,family,version,reusable,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        v
      );
    }

    console.log('[seed] inserting customers...');
    const customers = [
      ['CUS-001', 'Iridium Communications',  'USA',  'launch-ops@iridium.com',     'commercial',  'active'],
      ['CUS-002', 'NASA Launch Services',    'USA',  'lsp@nasa.gov',               'government',  'active'],
      ['CUS-003', 'OneWeb',                  'UK',   'manifest@oneweb.world',      'commercial',  'active'],
      ['CUS-004', 'European Space Agency',   'EU',   'launch@esa.int',             'government',  'active'],
      ['CUS-005', 'Maxar Technologies',      'USA',  'flights@maxar.com',          'commercial',  'active'],
      ['CUS-006', 'Planet Labs',             'USA',  'launches@planet.com',        'commercial',  'active'],
      ['CUS-007', 'Spaceflight Industries',  'USA',  'rideshare@spaceflight.com',  'broker',      'active'],
      ['CUS-008', 'JAXA',                    'JP',   'launches@jaxa.jp',           'government',  'active'],
      ['CUS-009', 'Telesat',                 'CA',   'flightops@telesat.com',      'commercial',  'active'],
      ['CUS-010', 'Astranis',                'USA',  'manifest@astranis.com',      'commercial',  'active'],
      ['CUS-011', 'Sierra Space',            'USA',  'ops@sierraspace.com',        'commercial',  'active'],
      ['CUS-012', 'Northrop Grumman',        'USA',  'launch@northropgrumman.com', 'commercial',  'active'],
      ['CUS-013', 'Axiom Space',             'USA',  'flights@axiomspace.com',     'commercial',  'active'],
      ['CUS-014', 'KARI',                    'KR',   'launches@kari.re.kr',        'government',  'active'],
      ['CUS-015', 'University CubeSat Consortium', 'USA', 'cubesats@stanford.edu', 'academic',    'pending'],
    ];
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (customer_id,name,country,contact,type,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting payloads...');
    const payloads = [
      ['PL-2026-001', 'CUS-001', 860,   'LEO 780km/86.4°',  'LV-FH9B5', 'integrated'],
      ['PL-2026-002', 'CUS-002', 2100,  'GTO',              'LV-VUL01', 'integrated'],
      ['PL-2026-003', 'CUS-003', 145,   'LEO 1200km/87.9°', 'LV-FH9B5', 'manifest'],
      ['PL-2026-004', 'CUS-004', 4200,  'SSO 600km/97.8°',  'LV-ARI6',  'integrated'],
      ['PL-2026-005', 'CUS-005', 2800,  'SSO 530km/97.6°',  'LV-FH9B5', 'fueling'],
      ['PL-2026-006', 'CUS-006', 4,     'SSO 500km/97.4°',  'LV-ELN4',  'manifest'],
      ['PL-2026-007', 'CUS-007', 350,   'LEO 500km/45°',    'LV-FIR01', 'manifest'],
      ['PL-2026-008', 'CUS-008', 1500,  'GTO',              'LV-H3',    'integrated'],
      ['PL-2026-009', 'CUS-009', 4700,  'GEO',              'LV-FH9HV', 'manifest'],
      ['PL-2026-010', 'CUS-010', 400,   'GEO',              'LV-FH9B5', 'integrated'],
      ['PL-2026-011', 'CUS-011', 7800,  'LEO 450km/51.6°',  'LV-VUL01', 'manifest'],
      ['PL-2026-012', 'CUS-012', 8500,  'LEO 420km/51.6°',  'LV-ATL5',  'integrated'],
      ['PL-2026-013', 'CUS-013', 9100,  'LEO 415km/51.6°',  'LV-FH9B5', 'flight_ready'],
      ['PL-2026-014', 'CUS-014', 1600,  'SSO 550km/98°',    'LV-NGL01', 'manifest'],
      ['PL-2026-015', 'CUS-015', 12,    'LEO 500km/97.4°',  'LV-ELN4',  'pending'],
    ];
    for (const p of payloads) {
      await client.query(
        `INSERT INTO payloads (payload_id,customer_id,mass_kg,target_orbit,vehicle_id,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        p
      );
    }

    console.log('[seed] inserting missions...');
    const missions = [
      ['MIS-2026-001', 'IRIDIUM NEXT-9 BATCH', 'LV-FH9B5', '2026-05-22', 'scheduled', 'commercial'],
      ['MIS-2026-002', 'NROL-114',             'LV-VUL01', '2026-05-25', 'scheduled', 'government'],
      ['MIS-2026-003', 'ONEWEB-22',            'LV-FH9B5', '2026-06-02', 'planning',  'commercial'],
      ['MIS-2026-004', 'GALILEO L13',          'LV-ARI6',  '2026-06-10', 'scheduled', 'government'],
      ['MIS-2026-005', 'MAXAR WORLDVIEW-LEGION-3', 'LV-FH9B5', '2026-05-29', 'scrubbed', 'commercial'],
      ['MIS-2026-006', 'PLANET FLOCK-25',      'LV-ELN4',  '2026-06-04', 'planning',  'commercial'],
      ['MIS-2026-007', 'SHERPA-LTC2 RIDESHARE','LV-FIR01', '2026-06-12', 'planning',  'rideshare'],
      ['MIS-2026-008', 'HTV-X3',               'LV-H3',    '2026-07-08', 'scheduled', 'government'],
      ['MIS-2026-009', 'TELESAT LIGHTSPEED-1', 'LV-FH9HV', '2026-07-22', 'planning',  'commercial'],
      ['MIS-2026-010', 'ASTRANIS ARCTURUS-2',  'LV-FH9B5', '2026-06-18', 'integrated','commercial'],
      ['MIS-2026-011', 'DREAMCHASER DC-2',     'LV-VUL01', '2026-08-05', 'planning',  'commercial'],
      ['MIS-2026-012', 'CYGNUS NG-25',         'LV-ATL5',  '2026-07-30', 'planning',  'cargo'],
      ['MIS-2026-013', 'AX-5 CREW',            'LV-FH9B5', '2026-09-12', 'manifest',  'crewed'],
      ['MIS-2026-014', 'KOREASAT-9',           'LV-NGL01', '2026-08-21', 'planning',  'commercial'],
      ['MIS-2026-015', 'EDUCUBE-XII',          'LV-ELN4',  '2026-07-15', 'manifest',  'rideshare'],
    ];
    for (const m of missions) {
      await client.query(
        `INSERT INTO missions (mission_id,name,vehicle_id,launch_date,status,mission_type) VALUES ($1,$2,$3,$4,$5,$6)`,
        m
      );
    }

    console.log('[seed] inserting launch_windows...');
    const windows = [
      ['LW-001', 'MIS-2026-001', '2026-05-22 04:18+00', '2026-05-22 04:35+00', 87, 'open'],
      ['LW-002', 'MIS-2026-001', '2026-05-23 04:14+00', '2026-05-23 04:31+00', 71, 'backup'],
      ['LW-003', 'MIS-2026-002', '2026-05-25 22:00+00', '2026-05-26 02:00+00', 65, 'open'],
      ['LW-004', 'MIS-2026-003', '2026-06-02 12:42+00', '2026-06-02 12:58+00', 78, 'open'],
      ['LW-005', 'MIS-2026-004', '2026-06-10 18:25+00', '2026-06-10 19:55+00', 82, 'open'],
      ['LW-006', 'MIS-2026-005', '2026-05-29 14:10+00', '2026-05-29 14:32+00', 22, 'closed'],
      ['LW-007', 'MIS-2026-005', '2026-05-30 14:06+00', '2026-05-30 14:28+00', 58, 'open'],
      ['LW-008', 'MIS-2026-006', '2026-06-04 23:51+00', '2026-06-05 00:09+00', 74, 'open'],
      ['LW-009', 'MIS-2026-007', '2026-06-12 16:30+00', '2026-06-12 17:20+00', 60, 'open'],
      ['LW-010', 'MIS-2026-008', '2026-07-08 07:14+00', '2026-07-08 07:34+00', 80, 'open'],
      ['LW-011', 'MIS-2026-009', '2026-07-22 02:00+00', '2026-07-22 06:00+00', 70, 'open'],
      ['LW-012', 'MIS-2026-010', '2026-06-18 23:42+00', '2026-06-19 00:18+00', 84, 'open'],
      ['LW-013', 'MIS-2026-011', '2026-08-05 10:00+00', '2026-08-05 14:00+00', 50, 'open'],
      ['LW-014', 'MIS-2026-013', '2026-09-12 16:48+00', '2026-09-12 17:05+00', 88, 'open'],
      ['LW-015', 'MIS-2026-014', '2026-08-21 21:30+00', '2026-08-21 22:30+00', 76, 'open'],
    ];
    for (const w of windows) {
      await client.query(
        `INSERT INTO launch_windows (window_id,mission_id,opens_at,closes_at,probability_pct,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        w
      );
    }

    console.log('[seed] inserting range_assignments...');
    const ranges = [
      ['RA-001', 'Eastern Range (CCSFS)',   'MIS-2026-001', 'SLC-40',     '2026-05-22 02:00+00', '2026-05-22 06:00+00'],
      ['RA-002', 'Eastern Range (CCSFS)',   'MIS-2026-002', 'SLC-41',     '2026-05-25 20:00+00', '2026-05-26 04:00+00'],
      ['RA-003', 'Western Range (VSFB)',    'MIS-2026-003', 'SLC-4E',     '2026-06-02 10:00+00', '2026-06-02 14:30+00'],
      ['RA-004', 'CSG Kourou',              'MIS-2026-004', 'ELA-4',      '2026-06-10 16:00+00', '2026-06-10 21:00+00'],
      ['RA-005', 'Western Range (VSFB)',    'MIS-2026-005', 'SLC-4E',     '2026-05-29 12:00+00', '2026-05-29 16:00+00'],
      ['RA-006', 'Mahia Peninsula (RL-1)',  'MIS-2026-006', 'Pad B',      '2026-06-04 22:00+00', '2026-06-05 02:00+00'],
      ['RA-007', 'Cape Canaveral SLC-20',   'MIS-2026-007', 'SLC-20',     '2026-06-12 14:00+00', '2026-06-12 19:00+00'],
      ['RA-008', 'Tanegashima Space Center','MIS-2026-008', 'LP-2',       '2026-07-08 05:00+00', '2026-07-08 09:00+00'],
      ['RA-009', 'KSC LC-39A',              'MIS-2026-009', 'LC-39A',     '2026-07-22 00:00+00', '2026-07-22 08:00+00'],
      ['RA-010', 'Eastern Range (CCSFS)',   'MIS-2026-010', 'SLC-40',     '2026-06-18 22:00+00', '2026-06-19 02:00+00'],
      ['RA-011', 'Eastern Range (CCSFS)',   'MIS-2026-011', 'SLC-41',     '2026-08-05 08:00+00', '2026-08-05 16:00+00'],
      ['RA-012', 'NASA Wallops MARS LP-0A', 'MIS-2026-012', 'LP-0A',      '2026-07-30 20:00+00', '2026-07-31 00:00+00'],
      ['RA-013', 'KSC LC-39A',              'MIS-2026-013', 'LC-39A',     '2026-09-12 14:00+00', '2026-09-12 19:00+00'],
      ['RA-014', 'LC-1 Cape Canaveral',     'MIS-2026-014', 'LC-1',       '2026-08-21 19:00+00', '2026-08-22 00:00+00'],
      ['RA-015', 'Mahia Peninsula (RL-1)',  'MIS-2026-015', 'Pad A',      '2026-07-15 04:00+00', '2026-07-15 08:00+00'],
    ];
    for (const r of ranges) {
      await client.query(
        `INSERT INTO range_assignments (assignment_id,range,mission_id,asset,slot_start,slot_end) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting range_safety_zones...');
    const zones = [
      ['RSZ-001', 'CCSFS Pad Hazard Zone',          1.20, 'blast',         'restricted',  'active'],
      ['RSZ-002', 'KSC LC-39A Pad Zone',            1.50, 'blast',         'restricted',  'active'],
      ['RSZ-003', 'CCSFS Maritime Exclusion',      35.00, 'falling_debris','controlled',  'active'],
      ['RSZ-004', 'VSFB Western Maritime Zone',    42.00, 'falling_debris','controlled',  'active'],
      ['RSZ-005', 'Kourou Coastal Sterile Area',    8.00, 'blast',         'restricted',  'active'],
      ['RSZ-006', 'CCSFS Skywatch FAA TFR',        90.00, 'airspace',      'temporary',   'active'],
      ['RSZ-007', 'KSC LC-39A Toxic Plume Buffer', 12.00, 'toxic',         'restricted',  'active'],
      ['RSZ-008', 'Mahia Pad 1 Coast Zone',         6.00, 'blast',         'restricted',  'active'],
      ['RSZ-009', 'Wallops Atlantic Splash Zone',  60.00, 'falling_debris','controlled',  'active'],
      ['RSZ-010', 'Tanegashima Drop Zone',         28.00, 'falling_debris','controlled',  'active'],
      ['RSZ-011', 'Starbase Boca Chica Beach',      3.50, 'blast',         'restricted',  'active'],
      ['RSZ-012', 'VSFB LF-06 Pad Zone',            1.10, 'blast',         'restricted',  'standby'],
      ['RSZ-013', 'Wallops LP-0A Pad Zone',         0.90, 'blast',         'restricted',  'active'],
      ['RSZ-014', 'CSG First Stage Drop Zone',     55.00, 'falling_debris','controlled',  'active'],
      ['RSZ-015', 'New Glenn LZ-1 Recovery Zone',  18.00, 'recovery',      'controlled',  'active'],
    ];
    for (const z of zones) {
      await client.query(
        `INSERT INTO range_safety_zones (zone_id,name,perimeter_km,hazard_type,classification,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        z
      );
    }

    console.log('[seed] inserting weather_briefs...');
    const weather = [
      ['WX-001', 'CCSFS (Cape Canaveral)',  '2026-05-22 02:00+00', 4500,  12, 'GO'],
      ['WX-002', 'KSC (Merritt Island)',    '2026-05-22 03:00+00', 4200,  15, 'GO'],
      ['WX-003', 'VSFB (Vandenberg)',       '2026-06-02 11:00+00',  900,  18, 'NO-GO'],
      ['WX-004', 'CSG Kourou',              '2026-06-10 17:00+00', 6500,   9, 'GO'],
      ['WX-005', 'CCSFS (Cape Canaveral)',  '2026-05-29 13:30+00', 1800,  24, 'CAUTION'],
      ['WX-006', 'Mahia Peninsula',         '2026-06-04 23:00+00', 3800,  22, 'CAUTION'],
      ['WX-007', 'Tanegashima',             '2026-07-08 06:00+00', 5200,  11, 'GO'],
      ['WX-008', 'KSC (Merritt Island)',    '2026-07-22 01:30+00', 2800,  19, 'CAUTION'],
      ['WX-009', 'CCSFS (Cape Canaveral)',  '2026-06-18 23:00+00', 7000,   8, 'GO'],
      ['WX-010', 'Wallops MARS',            '2026-07-30 20:30+00', 4000,  14, 'GO'],
      ['WX-011', 'CCSFS (Cape Canaveral)',  '2026-08-05 09:00+00', 1500,  31, 'NO-GO'],
      ['WX-012', 'LC-1 Cape Canaveral',     '2026-08-21 20:00+00', 5800,   7, 'GO'],
      ['WX-013', 'Starbase Boca Chica',     '2026-06-15 12:00+00', 6800,  10, 'GO'],
      ['WX-014', 'VSFB (Vandenberg)',       '2026-07-04 09:00+00', 1200,  26, 'NO-GO'],
      ['WX-015', 'KSC (Merritt Island)',    '2026-09-12 16:00+00', 5200,  13, 'GO'],
    ];
    for (const w of weather) {
      await client.query(
        `INSERT INTO weather_briefs (brief_id,site,valid_at,ceiling_ft,winds_kt,recommendation) VALUES ($1,$2,$3,$4,$5,$6)`,
        w
      );
    }

    console.log('[seed] inserting recovery_assets...');
    const recovery = [
      ['REC-001', 'drone_ship',  'Port Canaveral, FL',   'deployed',   'Booster recovery — Atlantic',          '2026-05-10'],
      ['REC-002', 'drone_ship',  'Port of Los Angeles',  'available',  'Booster recovery — Pacific',           '2026-05-08'],
      ['REC-003', 'fairing_ship','Port Canaveral, FL',   'available',  'Fairing half retrieval',                '2026-05-04'],
      ['REC-004', 'fairing_ship','Port of Los Angeles',  'maintenance','Fairing half retrieval',                '2026-04-22'],
      ['REC-005', 'helicopter',  'Mahia Peninsula',      'available',  'Air-snare Electron 1st stage',          '2026-05-11'],
      ['REC-006', 'landing_zone','LZ-1 CCSFS',           'ready',      'Falcon 9 RTLS pad',                     '2026-05-12'],
      ['REC-007', 'landing_zone','LZ-4 VSFB',            'ready',      'Falcon 9 RTLS pad',                     '2026-05-09'],
      ['REC-008', 'landing_zone','LZ-1 KSC (New Glenn)', 'ready',      'New Glenn 1st stage pad',               '2026-05-07'],
      ['REC-009', 'tug',         'Port Canaveral, FL',   'available',  'Drone ship tow',                        '2026-05-05'],
      ['REC-010', 'rib_team',    'Cape Canaveral',       'available',  'Booster securement / safety',           '2026-05-12'],
      ['REC-011', 'rib_team',    'Vandenberg AFB',       'available',  'Booster securement / safety',           '2026-05-11'],
      ['REC-012', 'helicopter',  'Patrick SFB',          'standby',    'Crewed capsule contingency',            '2026-05-10'],
      ['REC-013', 'recovery_ship','Daytona Beach, FL',   'deployed',   'Crew Dragon splashdown recovery',       '2026-05-08'],
      ['REC-014', 'recovery_ship','Pensacola, FL',       'available',  'Crew Dragon splashdown recovery',       '2026-05-06'],
      ['REC-015', 'tow_aircraft','Mahia Peninsula',      'available',  'Helicopter snare backup',               '2026-05-09'],
    ];
    for (const r of recovery) {
      await client.query(
        `INSERT INTO recovery_assets (asset_id,type,location,status,capability,last_ops) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting fuel_inventory...');
    const fuels = [
      ['FI-001', 'RP-1',     420000, 'CCSFS Fuel Farm A',  'BATCH-2026-04A', '2027-04-15'],
      ['FI-002', 'LOX',     1850000, 'CCSFS LOX Storage',  'BATCH-2026-05B', '2026-08-01'],
      ['FI-003', 'LH2',      180000, 'KSC Pad 39A LH2',    'BATCH-2026-05C', '2026-07-12'],
      ['FI-004', 'CH4',      240000, 'Starbase LCH4',      'BATCH-2026-05D', '2026-09-30'],
      ['FI-005', 'RP-1',     310000, 'VSFB Fuel Storage',  'BATCH-2026-04E', '2027-04-22'],
      ['FI-006', 'LOX',     1420000, 'VSFB LOX Storage',   'BATCH-2026-05F', '2026-08-04'],
      ['FI-007', 'Hydrazine', 18000, 'Payload Processing FL','BATCH-2026-03G', '2027-03-18'],
      ['FI-008', 'MMH',       12000, 'Payload Processing FL','BATCH-2026-03H', '2027-03-20'],
      ['FI-009', 'N2O4',      14000, 'Payload Processing CA','BATCH-2026-03I', '2027-03-22'],
      ['FI-010', 'GHe',       42000, 'CCSFS Pressurant',   'BATCH-2026-04J', '2030-04-15'],
      ['FI-011', 'GN2',      120000, 'CCSFS Pressurant',   'BATCH-2026-04K', '2031-04-15'],
      ['FI-012', 'LOX',      980000, 'Kourou LOX Storage', 'BATCH-2026-05L', '2026-08-10'],
      ['FI-013', 'LH2',      120000, 'Kourou LH2',         'BATCH-2026-05M', '2026-07-20'],
      ['FI-014', 'RP-1',     145000, 'Mahia Fuel Farm',    'BATCH-2026-04N', '2027-04-25'],
      ['FI-015', 'LOX',      380000, 'Wallops LOX',        'BATCH-2026-05O', '2026-08-15'],
    ];
    for (const f of fuels) {
      await client.query(
        `INSERT INTO fuel_inventory (stock_id,fuel_type,qty_kg,location,batch,expiry) VALUES ($1,$2,$3,$4,$5,$6)`,
        f
      );
    }

    console.log('[seed] inserting ground_systems...');
    const ground = [
      ['GS-001', 'SLC-40 Transporter/Erector',  'transporter_erector', 'CCSFS SLC-40',         'nominal',     '2026-05-15 12:00+00'],
      ['GS-002', 'LC-39A Crew Access Arm',      'crew_access_arm',     'KSC LC-39A',           'nominal',     '2026-05-14 09:30+00'],
      ['GS-003', 'SLC-41 VIF Tower',            'integration_tower',   'CCSFS SLC-41',         'nominal',     '2026-05-13 14:00+00'],
      ['GS-004', 'SLC-4E Strongback',           'strongback',          'VSFB SLC-4E',          'nominal',     '2026-05-12 18:00+00'],
      ['GS-005', 'ELA-4 Mobile Gantry',         'gantry',              'CSG Kourou ELA-4',     'nominal',     '2026-05-15 06:00+00'],
      ['GS-006', 'SLC-40 LOX Loading System',   'fluid_loading',       'CCSFS SLC-40',         'maintenance', '2026-05-10 22:00+00'],
      ['GS-007', 'KSC 39A LH2 Vent Stack',      'fluid_loading',       'KSC LC-39A',           'nominal',     '2026-05-14 23:30+00'],
      ['GS-008', 'CCSFS Range Telemetry C-band','telemetry',           'CCSFS Range Ops',      'nominal',     '2026-05-15 04:15+00'],
      ['GS-009', 'VSFB Range Telemetry S-band', 'telemetry',           'VSFB Range Ops',       'nominal',     '2026-05-14 20:00+00'],
      ['GS-010', 'KSC Pad 39A Sound Suppression','water_deluge',       'KSC LC-39A',           'nominal',     '2026-05-12 11:00+00'],
      ['GS-011', 'CCSFS Lightning Towers',      'lightning_protection','CCSFS SLC-40',         'nominal',     '2026-05-11 16:30+00'],
      ['GS-012', 'Mahia Pad 1 Strongback',      'strongback',          'Mahia Peninsula RL-1', 'nominal',     '2026-05-13 21:00+00'],
      ['GS-013', 'Wallops LP-0A TEL',           'transporter_erector', 'Wallops MARS LP-0A',   'maintenance', '2026-05-09 13:45+00'],
      ['GS-014', 'KSC HIF Roll-out Track',      'roll_track',          'KSC HIF',              'nominal',     '2026-05-14 17:00+00'],
      ['GS-015', 'CCSFS Hot Fire Test Stand',   'test_stand',          'CCSFS Test Area',      'standby',     '2026-05-08 10:00+00'],
    ];
    for (const g of ground) {
      await client.query(
        `INSERT INTO ground_systems (system_id,name,type,location,status,last_check) VALUES ($1,$2,$3,$4,$5,$6)`,
        g
      );
    }

    console.log('[seed] inserting telemetry...');
    const telem = [
      ['TLM-001', 'MIS-2026-001', 'engine1.chamber_pressure', 96.8,  'bar',   '2026-05-22 04:18:12+00'],
      ['TLM-002', 'MIS-2026-001', 'engine1.thrust',           845.0, 'kN',    '2026-05-22 04:18:12+00'],
      ['TLM-003', 'MIS-2026-001', 'lox_tank.pressure',         3.42, 'bar',   '2026-05-22 04:18:12+00'],
      ['TLM-004', 'MIS-2026-001', 'rp1_tank.pressure',         2.96, 'bar',   '2026-05-22 04:18:12+00'],
      ['TLM-005', 'MIS-2026-001', 'guidance.q',              42100.0,'Pa',    '2026-05-22 04:19:23+00'],
      ['TLM-006', 'MIS-2026-002', 'engine.t-vac',            4150.0, 'kN',    '2026-05-25 22:00:08+00'],
      ['TLM-007', 'MIS-2026-002', 'centaur.lh2_level',         92.0, 'pct',   '2026-05-25 22:00:08+00'],
      ['TLM-008', 'MIS-2026-003', 'engine1.thrust',           812.0, 'kN',    '2026-06-02 12:42:05+00'],
      ['TLM-009', 'MIS-2026-005', 'flight.altitude',         12500.0,'m',     '2026-05-29 14:12:18+00'],
      ['TLM-010', 'MIS-2026-005', 'flight.velocity',           785.0,'m/s',   '2026-05-29 14:12:18+00'],
      ['TLM-011', 'MIS-2026-010', 'engine.chamber_temp',     3380.0, 'K',     '2026-06-18 23:42:11+00'],
      ['TLM-012', 'MIS-2026-001', 'helium.pressure',          245.0, 'bar',   '2026-05-22 04:18:12+00'],
      ['TLM-013', 'MIS-2026-001', 'stage1.acceleration',        2.4, 'g',     '2026-05-22 04:19:23+00'],
      ['TLM-014', 'MIS-2026-002', 'guidance.attitude_pitch',   83.2, 'deg',   '2026-05-25 22:01:30+00'],
      ['TLM-015', 'MIS-2026-008', 'engine.lh2_inlet_temp',     20.3, 'K',     '2026-07-08 07:14:02+00'],
    ];
    for (const t of telem) {
      await client.query(
        `INSERT INTO telemetry (point_id,mission_id,channel,value,units,ts) VALUES ($1,$2,$3,$4,$5,$6)`,
        t
      );
    }

    console.log('[seed] inserting anomalies...');
    const anomalies = [
      ['ANM-001', 'MIS-2026-005', 'Fairing Acoustic Sensor',     'medium',  '2026-05-28 18:00+00', 'investigating'],
      ['ANM-002', 'MIS-2026-002', 'Centaur LH2 Pre-press Valve', 'high',    '2026-05-25 17:20+00', 'open'],
      ['ANM-003', 'MIS-2026-001', 'GSE-LOX Loading Skid #3',     'low',     '2026-05-21 22:10+00', 'resolved'],
      ['ANM-004', 'MIS-2026-009', 'Falcon Heavy Side Booster B1','medium',  '2026-07-20 09:00+00', 'open'],
      ['ANM-005', 'MIS-2026-004', 'Ariane 6 ESC stage GSE GHe',  'low',     '2026-06-09 14:00+00', 'investigating'],
      ['ANM-006', 'MIS-2026-005', 'Range Safety Beacon RF',      'high',    '2026-05-28 19:45+00', 'open'],
      ['ANM-007', 'MIS-2026-010', 'Avionics Power Supply',       'medium',  '2026-06-17 11:00+00', 'investigating'],
      ['ANM-008', 'MIS-2026-007', 'Sherpa Deployer Latch',       'low',     '2026-06-10 08:30+00', 'open'],
      ['ANM-009', 'MIS-2026-003', 'Second Stage TVC Actuator',   'high',    '2026-06-01 21:00+00', 'open'],
      ['ANM-010', 'MIS-2026-013', 'Crew Dragon ECLSS Sensor',    'medium',  '2026-09-10 19:00+00', 'investigating'],
      ['ANM-011', 'MIS-2026-008', 'H3 SRB-3 igniter charge',     'critical','2026-07-07 16:00+00', 'open'],
      ['ANM-012', 'MIS-2026-012', 'Cygnus solar array latch',    'low',     '2026-07-28 12:00+00', 'open'],
      ['ANM-013', 'MIS-2026-014', 'New Glenn BE-4 #4 chill',     'medium',  '2026-08-20 03:00+00', 'investigating'],
      ['ANM-014', 'MIS-2026-006', 'Electron stage-2 battery V',  'low',     '2026-06-03 22:00+00', 'resolved'],
      ['ANM-015', 'MIS-2026-001', 'Stage-2 RCS heater',          'low',     '2026-05-21 23:50+00', 'resolved'],
    ];
    for (const a of anomalies) {
      await client.query(
        `INSERT INTO anomalies (anom_id,mission_id,system,severity,opened_at,status) VALUES ($1,$2,$3,$4,$5,$6)`,
        a
      );
    }

    console.log('[seed] inserting debris_conjunctions...');
    const conj = [
      ['CJ-001', 'STARLINK-3219',          'COSMOS 1408 DEB',         0.412, 0.00021000, '2026-05-22 05:18+00'],
      ['CJ-002', 'IRIDIUM 113',            'FENGYUN 1C DEB',          1.220, 0.00004500, '2026-05-22 11:42+00'],
      ['CJ-003', 'ISS',                    'COSMOS 2251 DEB',         2.880, 0.00001200, '2026-05-23 18:05+00'],
      ['CJ-004', 'STARLINK-4101',          'IRIDIUM 33 DEB',          0.890, 0.00008800, '2026-05-22 09:30+00'],
      ['CJ-005', 'CREW DRAGON ENDEAVOUR',  'STARLINK-2007',           3.460, 0.00000900, '2026-05-25 03:42+00'],
      ['CJ-006', 'GALILEO 25',             'ARIANE 5 R/B',            1.950, 0.00003200, '2026-06-10 22:18+00'],
      ['CJ-007', 'LANDSAT 9',              'COSMOS 1408 DEB',         0.640, 0.00012500, '2026-05-29 04:15+00'],
      ['CJ-008', 'ONEWEB-0567',            'COSMOS 1408 DEB',         0.310, 0.00045000, '2026-06-02 14:00+00'],
      ['CJ-009', 'GPS IIF-12',             'GPS IIA-30 R/B',          4.220, 0.00000400, '2026-06-15 06:30+00'],
      ['CJ-010', 'WORLDVIEW LEGION 3',     'FENGYUN 1C DEB',          0.780, 0.00010100, '2026-05-29 18:48+00'],
      ['CJ-011', 'TIANGONG',               'STARLINK-1812',           1.420, 0.00006700, '2026-06-04 09:00+00'],
      ['CJ-012', 'STARLINK-5102',          'NIMBUS 7 DEB',            0.520, 0.00018200, '2026-06-18 10:12+00'],
      ['CJ-013', 'IRIDIUM NEXT-186',       'IRIDIUM 33 DEB',          0.270, 0.00060000, '2026-05-22 06:00+00'],
      ['CJ-014', 'NROL-114 PAYLOAD',       'COSMOS 2251 DEB',         0.940, 0.00009100, '2026-05-26 03:30+00'],
      ['CJ-015', 'ASTRANIS ARCTURUS-1',    'INMARSAT-3 R/B',          5.110, 0.00000300, '2026-06-19 02:00+00'],
    ];
    for (const c of conj) {
      await client.query(
        `INSERT INTO debris_conjunctions (conj_id,object_a,object_b,miss_distance_km,probability,tca_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        c
      );
    }

    console.log('[seed] inserting comms_links...');
    const links = [
      ['CL-001', 'MIS-2026-001', 'CCSFS TEL-4',      2256.500, 'locked',   '2026-05-22 04:18:00+00'],
      ['CL-002', 'MIS-2026-001', 'Antigua TT&C',     2272.500, 'standby',  '2026-05-22 04:25:00+00'],
      ['CL-003', 'MIS-2026-002', 'CCSFS TEL-1',      2207.500, 'locked',   '2026-05-25 22:00:00+00'],
      ['CL-004', 'MIS-2026-002', 'Ascension TT&C',   2287.500, 'standby',  '2026-05-25 22:18:00+00'],
      ['CL-005', 'MIS-2026-003', 'VSFB TEL-1',       2245.500, 'locked',   '2026-06-02 12:42:00+00'],
      ['CL-006', 'MIS-2026-004', 'Galliot Kourou',   2208.250, 'locked',   '2026-06-10 18:25:00+00'],
      ['CL-007', 'MIS-2026-004', 'Natal (Brazil)',   2271.500, 'standby',  '2026-06-10 18:40:00+00'],
      ['CL-008', 'MIS-2026-005', 'VSFB TEL-2',       2225.500, 'standby',  '2026-05-29 14:10:00+00'],
      ['CL-009', 'MIS-2026-006', 'Mahia DSN',        2202.500, 'standby',  '2026-06-04 23:51:00+00'],
      ['CL-010', 'MIS-2026-008', 'Tanegashima C',    2280.000, 'locked',   '2026-07-08 07:14:00+00'],
      ['CL-011', 'MIS-2026-010', 'CCSFS TEL-3',      2266.500, 'standby',  '2026-06-18 23:42:00+00'],
      ['CL-012', 'MIS-2026-013', 'KSC Hangar TT&C',  2208.000, 'standby',  '2026-09-12 16:48:00+00'],
      ['CL-013', 'MIS-2026-009', 'KSC TEL-2',        2254.000, 'standby',  '2026-07-22 02:00:00+00'],
      ['CL-014', 'MIS-2026-012', 'Wallops TEL-1',    2241.500, 'standby',  '2026-07-30 20:00:00+00'],
      ['CL-015', 'MIS-2026-014', 'LC-1 TT&C',        2299.500, 'standby',  '2026-08-21 21:30:00+00'],
    ];
    for (const l of links) {
      await client.query(
        `INSERT INTO comms_links (link_id,mission_id,station,freq_mhz,status,last_locked) VALUES ($1,$2,$3,$4,$5,$6)`,
        l
      );
    }

    console.log('[seed] inserting regulatory_approvals...');
    const approvals = [
      ['RAP-001', 'MIS-2026-001', 'FAA AST',          'launch_license',     'approved',  '2026-04-12'],
      ['RAP-002', 'MIS-2026-002', 'FAA AST',          'launch_license',     'approved',  '2026-04-20'],
      ['RAP-003', 'MIS-2026-003', 'FAA AST',          'launch_license',     'pending',   null],
      ['RAP-004', 'MIS-2026-004', 'ESA / CNES',       'launch_license',     'approved',  '2026-04-15'],
      ['RAP-005', 'MIS-2026-005', 'FAA AST',          'launch_license',     'approved',  '2026-04-25'],
      ['RAP-006', 'MIS-2026-006', 'New Zealand MoT',  'launch_permit',      'approved',  '2026-04-30'],
      ['RAP-007', 'MIS-2026-007', 'FAA AST',          'launch_license',     'approved',  '2026-05-02'],
      ['RAP-008', 'MIS-2026-008', 'JAXA / MEXT',      'launch_license',     'approved',  '2026-05-04'],
      ['RAP-009', 'MIS-2026-009', 'FAA AST',          'launch_license',     'pending',   null],
      ['RAP-010', 'MIS-2026-010', 'FAA AST',          'launch_license',     'approved',  '2026-05-08'],
      ['RAP-011', 'MIS-2026-011', 'FAA AST',          'launch_license',     'pending',   null],
      ['RAP-012', 'MIS-2026-012', 'FAA AST',          'launch_license',     'approved',  '2026-05-12'],
      ['RAP-013', 'MIS-2026-013', 'FAA AST + NASA',   'crewed_authorization','approved', '2026-05-14'],
      ['RAP-014', 'MIS-2026-014', 'FAA AST',          'launch_license',     'pending',   null],
      ['RAP-015', 'MIS-2026-015', 'New Zealand MoT',  'launch_permit',      'approved',  '2026-05-16'],
    ];
    for (const a of approvals) {
      await client.query(
        `INSERT INTO regulatory_approvals (approval_id,mission_id,authority,type,status,issued_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        a
      );
    }

    console.log('[seed] inserting post_flight_reports...');
    const reports = [
      ['PFR-001', 'MIS-2026-001', 'Nominal ascent; payloads deployed to 780km/86.4° within 0.01% of target.', 'No major anomalies; minor stage-2 RCS heater warmup delay.',                                  'draft',    'L. Ortega'],
      ['PFR-002', 'MIS-2026-005', 'Mission scrubbed at T-12 due to upper-level winds 31 kt at FL280.',         'WX-005 issued CAUTION; range decision tree triggered scrub.',                                  'final',    'M. Daniels'],
      ['PFR-003', 'MIS-2026-003', 'Pre-flight review in progress; targeting June 2 window.',                   'TVC actuator anomaly under review (ANM-009).',                                                 'draft',    'P. Singh'],
      ['PFR-004', 'MIS-2026-002', 'Pre-flight readiness review complete; LH2 valve being replaced.',           'ANM-002 LH2 pre-press valve replacement on critical path.',                                    'draft',    'R. Kim'],
      ['PFR-005', 'MIS-2026-004', 'Galileo L13 launch ready; weather GO at Kourou.',                            'No anomalies.',                                                                                 'draft',    'B. Laurent'],
      ['PFR-006', 'MIS-2026-006', 'Electron Flock-25 launched nominally; helicopter air-snare achieved.',       'Battery voltage anomaly resolved post-recovery (ANM-014).',                                    'final',    'K. Williams'],
      ['PFR-007', 'MIS-2026-008', 'H3 #24L mission delayed pending SRB-3 igniter charge investigation.',        'ANM-011 igniter charge anomaly classified critical.',                                          'draft',    'T. Sato'],
      ['PFR-008', 'MIS-2026-010', 'Astranis Arcturus-2 integration complete; range approval pending.',           'GSE LOX skid #6 maintenance complete.',                                                        'draft',    'L. Ortega'],
      ['PFR-009', 'MIS-2026-007', 'Sherpa-LTC2 rideshare manifest finalized.',                                   'Deployer latch anomaly ANM-008 under investigation.',                                          'draft',    'D. Nakamura'],
      ['PFR-010', 'MIS-2026-009', 'Lightspeed-1 GEO mission planning underway.',                                'Falcon Heavy side booster B1 wear analysis in progress (ANM-004).',                            'draft',    'R. Kim'],
      ['PFR-011', 'MIS-2026-011', 'Dreamchaser DC-2 mission planning.',                                          'No anomalies.',                                                                                 'draft',    'P. Singh'],
      ['PFR-012', 'MIS-2026-012', 'Cygnus NG-25 ISS resupply planning.',                                         'Solar array latch monitoring (ANM-012).',                                                      'draft',    'M. Daniels'],
      ['PFR-013', 'MIS-2026-013', 'AX-5 crewed mission planning; crew currently in suit-fit.',                  'ECLSS sensor anomaly under investigation (ANM-010).',                                          'draft',    'L. Ortega'],
      ['PFR-014', 'MIS-2026-014', 'Koreasat-9 manifest received; New Glenn BE-4 #4 anomaly being chased.',      'ANM-013 BE-4 chill anomaly under root-cause investigation.',                                   'draft',    'B. Laurent'],
      ['PFR-015', 'MIS-2026-015', 'Educube-XII rideshare manifest in pre-flight review.',                       'No anomalies.',                                                                                 'draft',    'K. Williams'],
    ];
    for (const r of reports) {
      await client.query(
        `INSERT INTO post_flight_reports (report_id,mission_id,summary,anomalies,status,owner) VALUES ($1,$2,$3,$4,$5,$6)`,
        r
      );
    }

    console.log('[seed] inserting audit_log...');
    const audit = [
      ['AUD-001', 'ops@spaceport.io',     'MIS-2026-005',  'scrub',          'ok',     '2026-05-29 14:00+00'],
      ['AUD-002', 'admin@spaceport.io',   'CUS-015',       'create',         'ok',     '2026-05-15 11:00+00'],
      ['AUD-003', 'ops@spaceport.io',     'RAP-003',       'approve_request','ok',     '2026-05-16 09:30+00'],
      ['AUD-004', 'admin@spaceport.io',   'LV-FH9B5',      'update',         'ok',     '2026-05-12 16:45+00'],
      ['AUD-005', 'ops@spaceport.io',     'ANM-011',       'open',           'ok',     '2026-07-07 16:00+00'],
      ['AUD-006', 'viewer@spaceport.io',  'MIS-2026-001',  'view',           'ok',     '2026-05-20 09:00+00'],
      ['AUD-007', 'admin@spaceport.io',   'GS-006',        'maintenance',    'ok',     '2026-05-10 22:00+00'],
      ['AUD-008', 'ops@spaceport.io',     'PL-2026-013',   'flight_ready',   'ok',     '2026-05-18 12:00+00'],
      ['AUD-009', 'ops@spaceport.io',     'LW-006',        'close',          'ok',     '2026-05-29 14:32+00'],
      ['AUD-010', 'admin@spaceport.io',   'webhook-1',     'create',         'ok',     '2026-05-10 14:00+00'],
      ['AUD-011', 'ops@spaceport.io',     'CJ-008',        'maneuver_plan',  'ok',     '2026-06-01 18:30+00'],
      ['AUD-012', 'admin@spaceport.io',   'users/ops',     'role_assign',    'ok',     '2026-05-09 10:00+00'],
      ['AUD-013', 'ops@spaceport.io',     'PFR-002',       'finalize',       'ok',     '2026-05-30 16:00+00'],
      ['AUD-014', 'ops@spaceport.io',     'MIS-2026-001',  'go_for_launch',  'ok',     '2026-05-22 04:00+00'],
      ['AUD-015', 'admin@spaceport.io',   'audit_log',     'export',         'ok',     '2026-05-16 18:00+00'],
    ];
    for (const a of audit) {
      await client.query(
        `INSERT INTO audit_log (entry_id,actor,target,action,result,ts) VALUES ($1,$2,$3,$4,$5,$6)`,
        a
      );
    }

    console.log('[seed] inserting users...');
    const users = [
      ['admin@spaceport.io',  'admin123',  'Spaceport Admin', 'admin'],
      ['ops@spaceport.io',    'ops123',    'Launch Ops',      'ops'],
      ['viewer@spaceport.io', 'viewer123', 'Range Viewer',    'viewer'],
    ];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4)`,
        u
      );
    }

    console.log('[seed] inserting notifications...');
    const notifications = [
      [1, 'Mission scrub — MAXAR WV-LEGION-3',  'WX-005 winds 31kt at FL280 violated launch commit criteria.', 'high',     'missions'],
      [1, 'Critical anomaly — H3 SRB-3 igniter','ANM-011 classified critical; root-cause investigation open.', 'critical', 'anomalies'],
      [2, 'Debris conjunction — ONEWEB-0567',   'TCA 2026-06-02 14:00Z; miss 0.31 km; Pc 4.5e-4.',             'high',     'debris_conjunctions'],
      [2, 'FAA license pending — MIS-2026-003', 'OneWeb-22 launch license pending FAA AST.',                   'medium',   'regulatory_approvals'],
      [1, 'GSE LOX skid #6 maintenance done',   'SLC-40 LOX loading nominal post-maintenance.',                'info',     'ground_systems'],
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id,title,body,severity,source) VALUES ($1,$2,$3,$4,$5)`,
        n
      );
    }

    console.log('[seed] inserting webhooks...');
    const webhooks = [
      ['Range Safety Notifier', 'https://httpbin.org/post', 'sec_range_2026',  'anomaly.critical,conjunction.high', true],
      ['Customer Comms Bridge', 'https://httpbin.org/post', 'sec_customer_2026','launch.scrub,launch.success',      true],
    ];
    for (const w of webhooks) {
      await client.query(
        `INSERT INTO webhooks (name,url,secret,events,active) VALUES ($1,$2,$3,$4,$5)`,
        w
      );
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();

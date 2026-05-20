import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRangeSafetyZones } from '../services/api';

// react-leaflet 4 + webpack does not auto-resolve the default marker icon path.
// Wire it up explicitly using the CDN-hosted PNGs so the launch-site marker
// renders without falling back to a broken-image glyph.
const DEFAULT_ICON = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

// Hazard-type → fill colour mapping for the safety circles.
const HAZARD_COLORS = {
  blast:     '#dc2626', // red
  debris:    '#f97316', // orange
  toxic:     '#a855f7', // purple
  exclusion: '#2563eb', // blue
};

function hazardColor(hazard) {
  return HAZARD_COLORS[String(hazard || '').toLowerCase()] || '#475569';
}

export default function RangeSafetyMap() {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getRangeSafetyZones();
        if (!alive) return;
        setData(res || { center: null, zones: [] });
      } catch (e) {
        if (alive) setError(e.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#64748b' }}>Loading range-safety map…</div>;
  if (error)   return <div style={{ padding: 16, color: '#ef4444' }}>Failed to load map: {error}</div>;

  const center = data?.center || { lat: 28.392, lng: -80.605, name: 'Cape Canaveral' };
  const zones  = Array.isArray(data?.zones) ? data.zones : [];

  // Hazard types actually present, for the legend
  const hazardsInUse = Array.from(new Set(zones.map((z) => z.hazard_type))).filter(Boolean);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
        Launch site: <strong>{center.name}</strong> ({center.lat.toFixed(3)}°, {center.lng.toFixed(3)}°)
        &nbsp;·&nbsp; {zones.length} safety zone{zones.length === 1 ? '' : 's'}
      </div>

      <div
        data-testid="range-safety-map-wrapper"
        style={{
          width:        '100%',
          height:       460,
          borderRadius: 6,
          overflow:     'hidden',
          border:       '1px solid #e2e8f0',
        }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={9}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[center.lat, center.lng]} icon={DEFAULT_ICON}>
            <Popup>
              <strong>{center.name}</strong>
              <br />Launch site reference
            </Popup>
          </Marker>
          {zones.map((z) => {
            if (!Number.isFinite(z.lat) || !Number.isFinite(z.lng)) return null;
            const color = hazardColor(z.hazard_type);
            // perimeter_km → metres (Circle radius in Leaflet is metres)
            const radiusM = Math.max(200, Number(z.perimeter_km) * 1000);
            return (
              <Circle
                key={z.id}
                center={[z.lat, z.lng]}
                radius={radiusM}
                pathOptions={{
                  color,
                  weight:      1.5,
                  fillColor:   color,
                  fillOpacity: 0.25,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{z.name}</div>
                    <div>Zone ID: {z.zone_id || z.id}</div>
                    <div>Hazard: <span style={{ color }}>{z.hazard_type}</span></div>
                    <div>Classification: {z.classification}</div>
                    <div>Perimeter: {z.perimeter_km} km</div>
                    <div>Status: {z.status}</div>
                  </div>
                </Popup>
              </Circle>
            );
          })}
        </MapContainer>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
        {hazardsInUse.map((h) => (
          <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span
              style={{
                width:           14,
                height:          14,
                background:      hazardColor(h),
                opacity:         0.7,
                display:         'inline-block',
                borderRadius:    '50%',
                border:          `1px solid ${hazardColor(h)}`,
              }}
            />
            <span style={{ color: '#475569' }}>{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

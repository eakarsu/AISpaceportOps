import React from 'react';
import LaunchTimeline from '../components/LaunchTimeline';
import ConjunctionScatter from '../components/ConjunctionScatter';
import RangeSafetyMap from '../components/RangeSafetyMap';
import TminusCountdown from '../components/TminusCountdown';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 20,
  marginBottom: 24,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
};

const titleStyle = {
  margin: 0,
  marginBottom: 4,
  fontSize: 18,
  fontWeight: 600,
  color: '#0f172a',
};

const subStyle = {
  margin: 0,
  marginBottom: 16,
  fontSize: 13,
  color: '#64748b',
};

export default function CustomViewsPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 20, fontSize: 24, color: '#0f172a' }}>
        Mission Views
      </h1>

      <section style={cardStyle} data-testid="card-tminus-countdown">
        <h2 style={titleStyle}>T-Minus Countdown</h2>
        <p style={subStyle}>
          Live digital countdown to the next scheduled mission. Updates every second,
          colours by urgency, and freezes when the mission status is <em>scrubbed</em>.
        </p>
        <TminusCountdown />
      </section>

      <section style={cardStyle} data-testid="card-range-safety-map">
        <h2 style={titleStyle}>Range-Safety Zone Map</h2>
        <p style={subStyle}>
          Active range-safety zones around the Cape Canaveral launch site. Each circle
          radius reflects the zone perimeter and is colour-coded by hazard type
          (blast = red, debris = orange, toxic = purple, exclusion = blue).
        </p>
        <RangeSafetyMap />
      </section>

      <section style={cardStyle} data-testid="card-launch-timeline">
        <h2 style={titleStyle}>Launch Timeline (Gantt)</h2>
        <p style={subStyle}>
          Horizontal Gantt of upcoming missions. Bar starts at launch_date and length
          reflects the mission_type duration. Colors encode mission status.
        </p>
        <LaunchTimeline />
      </section>

      <section style={cardStyle} data-testid="card-conjunction-scatter">
        <h2 style={titleStyle}>Conjunction Risk Scatter</h2>
        <p style={subStyle}>
          Debris conjunctions plotted by miss-distance vs collision probability.
          Red &lt;1 km &amp; &gt;10% Pc · Amber 1–5 km · Green safe. Dot size grows
          with TCA proximity.
        </p>
        <ConjunctionScatter />
      </section>
    </div>
  );
}

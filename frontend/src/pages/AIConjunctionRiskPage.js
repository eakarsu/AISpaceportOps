import React from 'react';
import AIPage from '../components/AIPage';
import { aiConjunctionRisk } from '../services/api';

export default function AIConjunctionRiskPage() {
  return (
    <AIPage
      title="AI · Conjunction Risk"
      feature="conjunction-risk"
      subtitle="Triage close-approach risk and recommend maneuver options."
      inputs={[
        { key: 'primary',          label: 'Primary object' },
        { key: 'secondary',        label: 'Secondary object' },
        { key: 'miss_distance_km', label: 'Miss distance (km)', type: 'number' },
        { key: 'probability',      label: 'Collision probability', type: 'number' },
        { key: 'tca_utc',          label: 'TCA (UTC)' },
      ]}
      run={(v) => aiConjunctionRisk(v)}
    />
  );
}

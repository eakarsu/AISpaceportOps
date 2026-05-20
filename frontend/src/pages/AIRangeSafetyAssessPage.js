import React from 'react';
import AIPage from '../components/AIPage';
import { aiRangeSafetyAssess } from '../services/api';

export default function AIRangeSafetyAssessPage() {
  return (
    <AIPage
      title="AI · Range Safety Assess"
      feature="range-safety-assess"
      subtitle="Assess hazard zone clearance, FTS status and 3rd-party risk."
      inputs={[
        { key: 'mission',            label: 'Mission' },
        { key: 'range',              label: 'Range' },
        { key: 'vehicle',            label: 'Vehicle' },
        { key: 'flight_termination', label: 'Flight Termination System' },
        { key: 'notes',              label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiRangeSafetyAssess(v)}
    />
  );
}

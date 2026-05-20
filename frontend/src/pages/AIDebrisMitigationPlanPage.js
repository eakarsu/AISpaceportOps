import React from 'react';
import AIPage from '../components/AIPage';
import { aiDebrisMitigationPlan } from '../services/api';

export default function AIDebrisMitigationPlanPage() {
  return (
    <AIPage
      title="AI · Debris Mitigation Plan"
      feature="debris-mitigation-plan"
      subtitle="Build a debris mitigation plan compliant with FCC / FAA / ISO 24113."
      inputs={[
        { key: 'mission',            label: 'Mission' },
        { key: 'vehicle_or_payload', label: 'Vehicle / Payload' },
        { key: 'constellation',      label: 'Constellation' },
        { key: 'operating_alt_km',   label: 'Operating altitude (km)', type: 'number' },
        { key: 'disposal_mode',      label: 'Disposal mode' },
      ]}
      run={(v) => aiDebrisMitigationPlan(v)}
    />
  );
}

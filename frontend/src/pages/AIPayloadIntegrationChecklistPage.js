import React from 'react';
import AIPage from '../components/AIPage';
import { aiPayloadIntegrationChecklist } from '../services/api';

export default function AIPayloadIntegrationChecklistPage() {
  return (
    <AIPage
      title="AI · Payload Integration Checklist"
      feature="payload-integration-checklist"
      subtitle="Draft a payload-side integration sequence — encapsulation, mate, electrical, RF compat, contamination. ADVISORY ONLY — requires safety officer sign-off."
      inputs={[
        { key: 'payload',          label: 'Payload' },
        { key: 'mission',          label: 'Mission' },
        { key: 'vehicle',          label: 'Vehicle' },
        { key: 'integration_site', label: 'Integration Site' },
        { key: 't_minus_window',   label: 'T-Minus Window (e.g. L-21d to L-3d)' },
        { key: 'notes',            label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiPayloadIntegrationChecklist(v)}
    />
  );
}

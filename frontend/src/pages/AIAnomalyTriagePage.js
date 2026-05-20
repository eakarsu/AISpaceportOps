import React from 'react';
import AIPage from '../components/AIPage';
import { aiAnomalyTriage } from '../services/api';

export default function AIAnomalyTriagePage() {
  return (
    <AIPage
      title="AI · Anomaly Triage"
      feature="anomaly-triage"
      subtitle="Triage severity, likely causes and launch impact for a vehicle anomaly."
      inputs={[
        { key: 'anomaly', label: 'Anomaly description' },
        { key: 'system',  label: 'System affected' },
        { key: 'context', label: 'Context / observations', type: 'textarea' },
      ]}
      run={(v) => aiAnomalyTriage(v)}
    />
  );
}

import React from 'react';
import AIPage from '../components/AIPage';
import { aiGroundSystemsChecklist } from '../services/api';

export default function AIGroundSystemsChecklistPage() {
  return (
    <AIPage
      title="AI · Ground Systems Checklist"
      feature="ground-systems-checklist"
      subtitle="Generate a pad / GSE readiness checklist with owners and due times."
      inputs={[
        { key: 'site',    label: 'Site' },
        { key: 'mission', label: 'Mission' },
        { key: 'vehicle', label: 'Vehicle' },
      ]}
      run={(v) => aiGroundSystemsChecklist(v)}
    />
  );
}

import React from 'react';
import AIPage from '../components/AIPage';
import { aiMissionBrief } from '../services/api';

export default function AIMissionBriefPage() {
  return (
    <AIPage
      title="AI · Mission Brief"
      feature="mission-brief"
      subtitle="Produce a pre-launch mission summary with milestones and risks."
      inputs={[
        { key: 'mission',      label: 'Mission' },
        { key: 'vehicle',      label: 'Vehicle' },
        { key: 'customer',     label: 'Customer' },
        { key: 'target_orbit', label: 'Target Orbit' },
        { key: 'site',         label: 'Launch Site' },
      ]}
      run={(v) => aiMissionBrief(v)}
    />
  );
}

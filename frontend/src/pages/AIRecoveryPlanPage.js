import React from 'react';
import AIPage from '../components/AIPage';
import { aiRecoveryPlan } from '../services/api';

export default function AIRecoveryPlanPage() {
  return (
    <AIPage
      title="AI · Recovery Plan"
      feature="recovery-plan"
      subtitle="Plan booster / capsule recovery — RTLS, ASDS, helicopter snare or splashdown."
      inputs={[
        { key: 'vehicle_element', label: 'Vehicle Element' },
        { key: 'recovery_mode',   label: 'Recovery Mode', type: 'select', options: ['RTLS','ASDS','helicopter_snare','splashdown','other'] },
        { key: 'notes',           label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiRecoveryPlan(v)}
    />
  );
}

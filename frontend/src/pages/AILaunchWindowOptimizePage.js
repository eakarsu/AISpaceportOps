import React from 'react';
import AIPage from '../components/AIPage';
import { aiLaunchWindowOptimize } from '../services/api';

export default function AILaunchWindowOptimizePage() {
  return (
    <AIPage
      title="AI · Launch Window Optimize"
      feature="launch-window-optimize"
      subtitle="Generate primary + backup launch windows with constraint evaluation."
      inputs={[
        { key: 'mission',      label: 'Mission' },
        { key: 'vehicle',      label: 'Vehicle' },
        { key: 'site',         label: 'Site' },
        { key: 'target_orbit', label: 'Target Orbit' },
        { key: 'constraints',  label: 'Constraints', type: 'textarea' },
      ]}
      run={(v) => aiLaunchWindowOptimize(v)}
    />
  );
}

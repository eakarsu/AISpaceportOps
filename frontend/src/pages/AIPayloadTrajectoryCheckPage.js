import React from 'react';
import AIPage from '../components/AIPage';
import { aiPayloadTrajectoryCheck } from '../services/api';

export default function AIPayloadTrajectoryCheckPage() {
  return (
    <AIPage
      title="AI · Payload Trajectory Check"
      feature="payload-trajectory-check"
      subtitle="Verify insertion margins, delta-v budget and mass margin."
      inputs={[
        { key: 'payload',         label: 'Payload' },
        { key: 'vehicle',         label: 'Vehicle' },
        { key: 'target_orbit',    label: 'Target Orbit' },
        { key: 'payload_mass_kg', label: 'Payload Mass (kg)', type: 'number' },
      ]}
      run={(v) => aiPayloadTrajectoryCheck(v)}
    />
  );
}

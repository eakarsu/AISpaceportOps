import React from 'react';
import AIPage from '../components/AIPage';
import { aiFuelLoadoutCalc } from '../services/api';

export default function AIFuelLoadoutCalcPage() {
  return (
    <AIPage
      title="AI · Fuel Loadout Calc"
      feature="fuel-loadout-calc"
      subtitle="Compute per-stage propellant + pressurant loads for a launch profile."
      inputs={[
        { key: 'vehicle',         label: 'Vehicle' },
        { key: 'mission',         label: 'Mission' },
        { key: 'payload_mass_kg', label: 'Payload Mass (kg)', type: 'number' },
        { key: 'target_orbit',    label: 'Target Orbit' },
      ]}
      run={(v) => aiFuelLoadoutCalc(v)}
    />
  );
}

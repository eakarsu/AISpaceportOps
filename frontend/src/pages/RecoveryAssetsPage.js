import React from 'react';
import CrudPage from '../components/CrudPage';
import { recoveryAssetsApi } from '../services/api';

export default function RecoveryAssetsPage() {
  return (
    <CrudPage
      title="Recovery Assets"
      subtitle="Drone ships, helicopters, RTLS pads, recovery ships."
      api={recoveryAssetsApi}
      statusKey="status"
      fields={[
        { key: 'asset_id',   label: 'Asset ID' },
        { key: 'type',       label: 'Type', type: 'select', options: ['drone_ship','fairing_ship','helicopter','landing_zone','tug','rib_team','recovery_ship','tow_aircraft'] },
        { key: 'location',   label: 'Location' },
        { key: 'status',     label: 'Status', type: 'select', options: ['available','deployed','maintenance','standby','ready'] },
        { key: 'capability', label: 'Capability' },
        { key: 'last_ops',   label: 'Last Ops', type: 'date' },
      ]}
    />
  );
}

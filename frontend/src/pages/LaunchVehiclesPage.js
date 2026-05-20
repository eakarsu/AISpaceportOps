import React from 'react';
import CrudPage from '../components/CrudPage';
import { launchVehiclesApi } from '../services/api';

export default function LaunchVehiclesPage() {
  return (
    <CrudPage
      title="Launch Vehicles"
      subtitle="Falcon, Vulcan, Ariane, Electron, Starship, New Glenn and more."
      api={launchVehiclesApi}
      statusKey="status"
      fields={[
        { key: 'vehicle_id', label: 'Vehicle ID' },
        { key: 'vendor',     label: 'Vendor' },
        { key: 'family',     label: 'Family' },
        { key: 'version',    label: 'Version' },
        { key: 'reusable',   label: 'Reusable', type: 'select', options: ['true','false'] },
        { key: 'status',     label: 'Status',   type: 'select', options: ['available','flight_test','development','retiring','restricted'] },
      ]}
    />
  );
}

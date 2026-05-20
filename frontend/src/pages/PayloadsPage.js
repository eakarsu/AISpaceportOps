import React from 'react';
import CrudPage from '../components/CrudPage';
import { payloadsApi } from '../services/api';

export default function PayloadsPage() {
  return (
    <CrudPage
      title="Payloads"
      subtitle="Customer payloads — mass, orbit and integration status."
      api={payloadsApi}
      statusKey="status"
      fields={[
        { key: 'payload_id',   label: 'Payload ID' },
        { key: 'customer_id',  label: 'Customer ID' },
        { key: 'mass_kg',      label: 'Mass (kg)', type: 'number' },
        { key: 'target_orbit', label: 'Target Orbit' },
        { key: 'vehicle_id',   label: 'Vehicle ID' },
        { key: 'status',       label: 'Status', type: 'select', options: ['manifest','pending','integrated','fueling','flight_ready'] },
      ]}
    />
  );
}

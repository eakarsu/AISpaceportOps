import React from 'react';
import CrudPage from '../components/CrudPage';
import { rangeSafetyZonesApi } from '../services/api';

export default function RangeSafetyZonesPage() {
  return (
    <CrudPage
      title="Range Safety Zones"
      subtitle="Blast / falling-debris / airspace exclusion perimeters."
      api={rangeSafetyZonesApi}
      statusKey="status"
      fields={[
        { key: 'zone_id',        label: 'Zone ID' },
        { key: 'name',           label: 'Name' },
        { key: 'perimeter_km',   label: 'Perimeter (km)', type: 'number' },
        { key: 'hazard_type',    label: 'Hazard Type',   type: 'select', options: ['blast','falling_debris','airspace','toxic','recovery'] },
        { key: 'classification', label: 'Classification',type: 'select', options: ['restricted','controlled','temporary','informational'] },
        { key: 'status',         label: 'Status',        type: 'select', options: ['active','standby','inactive'] },
      ]}
    />
  );
}

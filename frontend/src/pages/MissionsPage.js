import React from 'react';
import CrudPage from '../components/CrudPage';
import { missionsApi } from '../services/api';

export default function MissionsPage() {
  return (
    <CrudPage
      title="Missions"
      subtitle="Launch manifest — scheduled, planning, integrated, scrubbed."
      api={missionsApi}
      statusKey="status"
      fields={[
        { key: 'mission_id',   label: 'Mission ID' },
        { key: 'name',         label: 'Name' },
        { key: 'vehicle_id',   label: 'Vehicle ID' },
        { key: 'launch_date',  label: 'Launch Date', type: 'date' },
        { key: 'status',       label: 'Status',      type: 'select', options: ['planning','scheduled','integrated','manifest','scrubbed','launched','complete'] },
        { key: 'mission_type', label: 'Type',        type: 'select', options: ['commercial','government','crewed','cargo','rideshare'] },
      ]}
    />
  );
}

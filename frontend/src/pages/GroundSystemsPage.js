import React from 'react';
import CrudPage from '../components/CrudPage';
import { groundSystemsApi } from '../services/api';

export default function GroundSystemsPage() {
  return (
    <CrudPage
      title="Ground Systems"
      subtitle="Strongbacks, TELs, fluid loading, sound suppression, towers."
      api={groundSystemsApi}
      statusKey="status"
      fields={[
        { key: 'system_id',  label: 'System ID' },
        { key: 'name',       label: 'Name' },
        { key: 'type',       label: 'Type' },
        { key: 'location',   label: 'Location' },
        { key: 'status',     label: 'Status', type: 'select', options: ['nominal','maintenance','standby','offline'] },
        { key: 'last_check', label: 'Last Check', type: 'datetime-local' },
      ]}
    />
  );
}

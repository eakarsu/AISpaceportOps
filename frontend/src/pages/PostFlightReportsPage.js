import React from 'react';
import CrudPage from '../components/CrudPage';
import { postFlightReportsApi } from '../services/api';

export default function PostFlightReportsPage() {
  return (
    <CrudPage
      title="Post-Flight Reports"
      subtitle="Outcome narratives, anomalies observed, lessons learned."
      api={postFlightReportsApi}
      statusKey="status"
      fields={[
        { key: 'report_id',  label: 'Report ID' },
        { key: 'mission_id', label: 'Mission ID' },
        { key: 'summary',    label: 'Summary',   type: 'textarea' },
        { key: 'anomalies',  label: 'Anomalies', type: 'textarea' },
        { key: 'status',     label: 'Status', type: 'select', options: ['draft','review','final'] },
        { key: 'owner',      label: 'Owner' },
      ]}
    />
  );
}

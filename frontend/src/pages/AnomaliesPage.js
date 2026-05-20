import React from 'react';
import CrudPage from '../components/CrudPage';
import { anomaliesApi } from '../services/api';

export default function AnomaliesPage() {
  return (
    <CrudPage
      title="Anomalies"
      subtitle="Vehicle and ground system anomalies — open / investigating / resolved."
      api={anomaliesApi}
      statusKey="severity"
      fields={[
        { key: 'anom_id',    label: 'Anomaly ID' },
        { key: 'mission_id', label: 'Mission ID' },
        { key: 'system',     label: 'System' },
        { key: 'severity',   label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at',  label: 'Opened At', type: 'datetime-local' },
        { key: 'status',     label: 'Status', type: 'select', options: ['open','investigating','resolved','closed'] },
      ]}
    />
  );
}

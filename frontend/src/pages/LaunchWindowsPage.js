import React from 'react';
import CrudPage from '../components/CrudPage';
import { launchWindowsApi } from '../services/api';

export default function LaunchWindowsPage() {
  return (
    <CrudPage
      title="Launch Windows"
      subtitle="Primary and backup instantaneous / extended launch windows."
      api={launchWindowsApi}
      statusKey="status"
      fields={[
        { key: 'window_id',       label: 'Window ID' },
        { key: 'mission_id',      label: 'Mission ID' },
        { key: 'opens_at',        label: 'Opens At',  type: 'datetime-local' },
        { key: 'closes_at',       label: 'Closes At', type: 'datetime-local' },
        { key: 'probability_pct', label: 'Probability %', type: 'number' },
        { key: 'status',          label: 'Status', type: 'select', options: ['open','backup','closed','executed'] },
      ]}
    />
  );
}

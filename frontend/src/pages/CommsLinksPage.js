import React from 'react';
import CrudPage from '../components/CrudPage';
import { commsLinksApi } from '../services/api';

export default function CommsLinksPage() {
  return (
    <CrudPage
      title="Comms Links"
      subtitle="TT&C ground stations and downlink frequencies."
      api={commsLinksApi}
      statusKey="status"
      fields={[
        { key: 'link_id',     label: 'Link ID' },
        { key: 'mission_id',  label: 'Mission ID' },
        { key: 'station',     label: 'Station' },
        { key: 'freq_mhz',    label: 'Freq (MHz)', type: 'number' },
        { key: 'status',      label: 'Status', type: 'select', options: ['locked','standby','degraded','offline'] },
        { key: 'last_locked', label: 'Last Locked', type: 'datetime-local' },
      ]}
    />
  );
}

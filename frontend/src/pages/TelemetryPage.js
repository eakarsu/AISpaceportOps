import React from 'react';
import CrudPage from '../components/CrudPage';
import { telemetryApi } from '../services/api';

export default function TelemetryPage() {
  return (
    <CrudPage
      title="Telemetry"
      subtitle="Mission telemetry channels — chamber pressure, thrust, tank levels."
      api={telemetryApi}
      fields={[
        { key: 'point_id',   label: 'Point ID' },
        { key: 'mission_id', label: 'Mission ID' },
        { key: 'channel',    label: 'Channel' },
        { key: 'value',      label: 'Value', type: 'number' },
        { key: 'units',      label: 'Units' },
        { key: 'ts',         label: 'Timestamp', type: 'datetime-local' },
      ]}
    />
  );
}

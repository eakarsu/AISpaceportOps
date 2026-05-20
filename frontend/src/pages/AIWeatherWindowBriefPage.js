import React from 'react';
import AIPage from '../components/AIPage';
import { aiWeatherWindowBrief } from '../services/api';

export default function AIWeatherWindowBriefPage() {
  return (
    <AIPage
      title="AI · Weather Window Brief"
      feature="weather-window-brief"
      subtitle="Evaluate launch commit criteria against site forecast."
      inputs={[
        { key: 'site',         label: 'Site' },
        { key: 'valid_at_utc', label: 'Valid At (UTC)' },
        { key: 'vehicle',      label: 'Vehicle' },
        { key: 'criteria',     label: 'Criteria / observations', type: 'textarea' },
      ]}
      run={(v) => aiWeatherWindowBrief(v)}
    />
  );
}

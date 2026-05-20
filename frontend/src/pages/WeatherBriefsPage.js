import React from 'react';
import CrudPage from '../components/CrudPage';
import { weatherBriefsApi } from '../services/api';

export default function WeatherBriefsPage() {
  return (
    <CrudPage
      title="Weather Briefs"
      subtitle="Site weather and launch commit criteria evaluation."
      api={weatherBriefsApi}
      statusKey="recommendation"
      fields={[
        { key: 'brief_id',       label: 'Brief ID' },
        { key: 'site',           label: 'Site' },
        { key: 'valid_at',       label: 'Valid At',  type: 'datetime-local' },
        { key: 'ceiling_ft',     label: 'Ceiling (ft)', type: 'number' },
        { key: 'winds_kt',       label: 'Winds (kt)',   type: 'number' },
        { key: 'recommendation', label: 'Recommendation', type: 'select', options: ['GO','CAUTION','NO-GO'] },
      ]}
    />
  );
}

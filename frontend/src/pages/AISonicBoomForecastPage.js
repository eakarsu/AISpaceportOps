import React from 'react';
import AIPage from '../components/AIPage';
import { aiSonicBoomForecast } from '../services/api';

export default function AISonicBoomForecastPage() {
  return (
    <AIPage
      title="AI · Sonic Boom Forecast"
      feature="sonic-boom-forecast"
      subtitle="Population-overflight advisory for sonic-boom carpet during ascent, booster return or re-entry. ADVISORY ONLY — requires safety officer sign-off."
      inputs={[
        { key: 'mission',           label: 'Mission' },
        { key: 'vehicle',           label: 'Vehicle' },
        { key: 'phase',             label: 'Trajectory Phase', type: 'select',
          options: ['ascent','reentry','booster_return','abort'] },
        { key: 'trajectory_notes',  label: 'Trajectory / atmosphere notes', type: 'textarea' },
      ]}
      run={(v) => aiSonicBoomForecast(v)}
    />
  );
}

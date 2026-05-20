import React from 'react';
import AIPage from '../components/AIPage';
import { aiNgsLinkBudget } from '../services/api';

export default function AINgsLinkBudgetPage() {
  return (
    <AIPage
      title="AI · NGS Link Budget"
      feature="ngs-link-budget"
      subtitle="Ground-station / TT&C link budget — losses, margins, verdict."
      inputs={[
        { key: 'mission',            label: 'Mission' },
        { key: 'station',            label: 'Station' },
        { key: 'band',               label: 'Band', type: 'select', options: ['L','S','C','X','Ku','Ka'] },
        { key: 'freq_mhz',           label: 'Freq (MHz)', type: 'number' },
        { key: 'antenna_diameter_m', label: 'Antenna Diameter (m)', type: 'number' },
        { key: 'eirp_dbw',           label: 'EIRP (dBW)', type: 'number' },
      ]}
      run={(v) => aiNgsLinkBudget(v)}
    />
  );
}

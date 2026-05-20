import React from 'react';
import AIPage from '../components/AIPage';
import { aiPostFlightNarrative } from '../services/api';

export default function AIPostFlightNarrativePage() {
  return (
    <AIPage
      title="AI · Post-Flight Narrative"
      feature="post-flight-narrative"
      subtitle="Produce a mission outcome narrative with metrics and follow-on actions."
      inputs={[
        { key: 'mission',       label: 'Mission' },
        { key: 'outcome',       label: 'Outcome', type: 'select', options: ['success','partial','failure','scrub'] },
        { key: 'summary_input', label: 'Raw summary / observations', type: 'textarea' },
      ]}
      run={(v) => aiPostFlightNarrative(v)}
    />
  );
}

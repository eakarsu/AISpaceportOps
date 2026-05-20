import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="Spaceport command-level operational snapshot."
      inputs={[
        { key: 'notes', label: 'Bias / focus notes (optional)', type: 'textarea' },
      ]}
      run={(v) => aiExecutiveBrief({ notes: v.notes })}
    />
  );
}

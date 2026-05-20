import React from 'react';
import AIPage from '../components/AIPage';
import { aiDraftPressRelease } from '../services/api';

export default function AIDraftPressReleasePage() {
  return (
    <AIPage
      title="AI · Draft Press Release"
      feature="draft-press-release"
      subtitle="Draft a public-facing press release for a launch event."
      inputs={[
        { key: 'mission',  label: 'Mission' },
        { key: 'customer', label: 'Customer' },
        { key: 'vehicle',  label: 'Vehicle' },
        { key: 'outcome',  label: 'Outcome', type: 'select', options: ['success','partial','scrub','failure'] },
        { key: 'notes',    label: 'Notes', type: 'textarea' },
      ]}
      run={(v) => aiDraftPressRelease(v)}
    />
  );
}

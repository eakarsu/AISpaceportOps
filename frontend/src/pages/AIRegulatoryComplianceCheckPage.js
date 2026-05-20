import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegulatoryComplianceCheck } from '../services/api';

export default function AIRegulatoryComplianceCheckPage() {
  return (
    <AIPage
      title="AI · Regulatory Compliance Check"
      feature="regulatory-compliance-check"
      subtitle="Audit a mission for FAA / ESA / JAXA / NZ MoT approvals and filings."
      inputs={[
        { key: 'mission',   label: 'Mission' },
        { key: 'vehicle',   label: 'Vehicle' },
        { key: 'customer',  label: 'Customer' },
        { key: 'authority', label: 'Authority' },
        { key: 'context',   label: 'Context / known status', type: 'textarea' },
      ]}
      run={(v) => aiRegulatoryComplianceCheck(v)}
    />
  );
}

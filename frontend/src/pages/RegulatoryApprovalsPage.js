import React from 'react';
import CrudPage from '../components/CrudPage';
import { regulatoryApprovalsApi } from '../services/api';

export default function RegulatoryApprovalsPage() {
  return (
    <CrudPage
      title="Regulatory Approvals"
      subtitle="FAA AST, ESA/CNES, JAXA, NZ MoT approvals and licenses."
      api={regulatoryApprovalsApi}
      statusKey="status"
      fields={[
        { key: 'approval_id', label: 'Approval ID' },
        { key: 'mission_id',  label: 'Mission ID' },
        { key: 'authority',   label: 'Authority' },
        { key: 'type',        label: 'Type', type: 'select', options: ['launch_license','launch_permit','crewed_authorization','range_approval','ITU_filing'] },
        { key: 'status',      label: 'Status', type: 'select', options: ['approved','pending','missing','revoked'] },
        { key: 'issued_at',   label: 'Issued At', type: 'date' },
      ]}
    />
  );
}

import React from 'react';
import CrudPage from '../components/CrudPage';
import { customersApi } from '../services/api';

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Commercial, government, broker and academic customers."
      api={customersApi}
      statusKey="status"
      fields={[
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'name',        label: 'Name' },
        { key: 'country',     label: 'Country' },
        { key: 'contact',     label: 'Contact' },
        { key: 'type',        label: 'Type',   type: 'select', options: ['commercial','government','broker','academic'] },
        { key: 'status',      label: 'Status', type: 'select', options: ['active','pending','suspended','closed'] },
      ]}
    />
  );
}

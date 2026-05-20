import React from 'react';
import CrudPage from '../components/CrudPage';
import { rangeAssignmentsApi } from '../services/api';

export default function RangeAssignmentsPage() {
  return (
    <CrudPage
      title="Range Assignments"
      subtitle="Pad / range slot bookings for upcoming launches."
      api={rangeAssignmentsApi}
      fields={[
        { key: 'assignment_id', label: 'Assignment ID' },
        { key: 'range',         label: 'Range' },
        { key: 'mission_id',    label: 'Mission ID' },
        { key: 'asset',         label: 'Pad / Asset' },
        { key: 'slot_start',    label: 'Slot Start', type: 'datetime-local' },
        { key: 'slot_end',      label: 'Slot End',   type: 'datetime-local' },
      ]}
    />
  );
}

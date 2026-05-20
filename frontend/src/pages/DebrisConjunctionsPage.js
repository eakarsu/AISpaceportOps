import React from 'react';
import CrudPage from '../components/CrudPage';
import { debrisConjunctionsApi } from '../services/api';

export default function DebrisConjunctionsPage() {
  return (
    <CrudPage
      title="Debris Conjunctions"
      subtitle="On-orbit close-approach events and time-of-closest-approach tracking."
      api={debrisConjunctionsApi}
      fields={[
        { key: 'conj_id',          label: 'Conjunction ID' },
        { key: 'object_a',         label: 'Object A (primary)' },
        { key: 'object_b',         label: 'Object B (secondary)' },
        { key: 'miss_distance_km', label: 'Miss Distance (km)', type: 'number' },
        { key: 'probability',      label: 'Pc', type: 'number' },
        { key: 'tca_at',           label: 'TCA', type: 'datetime-local' },
      ]}
    />
  );
}

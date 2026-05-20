import React from 'react';
import CrudPage from '../components/CrudPage';
import { fuelInventoryApi } from '../services/api';

export default function FuelInventoryPage() {
  return (
    <CrudPage
      title="Fuel Inventory"
      subtitle="RP-1, LOX, LH2, CH4 and pressurant stocks across pads."
      api={fuelInventoryApi}
      fields={[
        { key: 'stock_id',  label: 'Stock ID' },
        { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['RP-1','LOX','LH2','CH4','Hydrazine','MMH','N2O4','GHe','GN2'] },
        { key: 'qty_kg',    label: 'Qty (kg)', type: 'number' },
        { key: 'location',  label: 'Location' },
        { key: 'batch',     label: 'Batch' },
        { key: 'expiry',    label: 'Expiry', type: 'date' },
      ]}
    />
  );
}

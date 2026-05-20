const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'fuel_inventory',
  fields: ['stock_id','fuel_type','qty_kg','location','batch','expiry'],
});

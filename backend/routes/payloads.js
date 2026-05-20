const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'payloads',
  fields: ['payload_id','customer_id','mass_kg','target_orbit','vehicle_id','status'],
});

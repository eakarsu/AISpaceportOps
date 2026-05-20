const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'range_safety_zones',
  fields: ['zone_id','name','perimeter_km','hazard_type','classification','status'],
});

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'launch_vehicles',
  fields: ['vehicle_id','vendor','family','version','reusable','status'],
});

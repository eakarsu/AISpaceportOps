const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'telemetry',
  fields: ['point_id','mission_id','channel','value','units','ts'],
});

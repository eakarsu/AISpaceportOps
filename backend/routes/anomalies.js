const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'anomalies',
  fields: ['anom_id','mission_id','system','severity','opened_at','status'],
});

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'post_flight_reports',
  fields: ['report_id','mission_id','summary','anomalies','status','owner'],
});

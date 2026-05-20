const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'launch_windows',
  fields: ['window_id','mission_id','opens_at','closes_at','probability_pct','status'],
});

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'missions',
  fields: ['mission_id','name','vehicle_id','launch_date','status','mission_type'],
});

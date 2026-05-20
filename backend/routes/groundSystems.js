const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ground_systems',
  fields: ['system_id','name','type','location','status','last_check'],
});

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'recovery_assets',
  fields: ['asset_id','type','location','status','capability','last_ops'],
});

const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'weather_briefs',
  fields: ['brief_id','site','valid_at','ceiling_ft','winds_kt','recommendation'],
});

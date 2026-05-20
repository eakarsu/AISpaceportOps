const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'range_assignments',
  fields: ['assignment_id','range','mission_id','asset','slot_start','slot_end'],
});

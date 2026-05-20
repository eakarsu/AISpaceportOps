const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'comms_links',
  fields: ['link_id','mission_id','station','freq_mhz','status','last_locked'],
});

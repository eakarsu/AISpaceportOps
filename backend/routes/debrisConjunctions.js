const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'debris_conjunctions',
  fields: ['conj_id','object_a','object_b','miss_distance_km','probability','tca_at'],
});

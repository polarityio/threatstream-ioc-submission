const { partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const getGrapqlQueryData = require('./getGrapqlQueryData/index');
const getRestQueryData = require('./getRestQueryData');
const createLookupResults = require('./createLookupResults');

const getLookupResults = (entities, options, requestWithDefaults, Logger) =>
  partitionFlatMap(
    async (_entitiesPartition) => {
      const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(
        _entitiesPartition
      );

      const lookupResults = createLookupResults(options, entitiesPartition);
      
      Logger.trace({ lookupResults }, 'Lookup Results');

      return lookupResults.concat(ignoredIpLookupResults);
    },
    20,
    entities
  );

module.exports = {
  getLookupResults
};

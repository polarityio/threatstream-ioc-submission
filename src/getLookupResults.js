const fp = require('lodash/fp');

const { _P, partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');

const getLookupResults = (
  entities,
  options,
  requestWithDefaults,
  Logger
) =>
  partitionFlatMap(
    async (_entitiesPartition) => {
      const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(
        _entitiesPartition
      );
      const entitiesThatExistInTS = await partitionFlatMap(
        async (entities) => {
          const result = await requestWithDefaults({
            url: `${options.url}/api/v2/intelligence/?username=${options.email}&api_key=${
              options.apiKey
            }&value__regexp=${fp.flow(fp.map(fp.get('value')), fp.join('|'))(entities)}`,
            method: 'get'
          });

          return fp.getOr([], 'body.objects', result);
        },
        5,
        entitiesPartition
      );

      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInTS
      );

      Logger.trace({ lookupResults, entitiesThatExistInTS }, 'Lookup Results');

      return lookupResults.concat(ignoredIpLookupResults);
    },
    20,
    entities
  );

module.exports = {
  getLookupResults
};

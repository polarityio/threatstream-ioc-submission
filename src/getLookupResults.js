const fp = require('lodash/fp');

const { partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');

const getLookupResults = (entities, options, requestWithDefaults, Logger) =>
  partitionFlatMap(
    async (_entitiesPartition) => {
      const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(
        _entitiesPartition
      );

      const { body } = await requestWithDefaults({
        url: `${options.url}/api/v2/intelligence/?username=${options.email}&api_key=${
          options.apiKey
        }&value__regexp=${fp.flow(
          fp.map(fp.get('value')),
          fp.join('|')
        )(entitiesPartition)}`,
        method: 'get'
      });

      const entitiesThatExistInTS = fp.getOr([], 'objects', body);
      
      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInTS
      );
      
      Logger.trace({ body, lookupResults }, 'Lookup Results');

      return lookupResults.concat(ignoredIpLookupResults);
    },
    20,
    entities
  );

module.exports = {
  getLookupResults
};

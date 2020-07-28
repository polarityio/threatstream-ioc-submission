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
        async (entities) =>
          fp.getOr(
            [],
            'body.objects',
            await requestWithDefaults({
              url: `${options.url}/api/v2/intelligence/?username=${
                options.email
              }&api_key=${options.apiKey}&value__regexp=${fp.flow(
                fp.map(fp.get('value')),
                fp.join('|')
              )(entities)}`,
              method: 'get'
            })
          ),
        5,
        entitiesPartition
      );

      const orgTags = fp.flow(
        fp.getOr([], 'body.objects'),
        fp.map(fp.get('name'))
      )(
        await requestWithDefaults({
          uri: `${options.url}/api/v1/orgtag/?username=${options.email}&api_key=${options.apiKey}`
        })
      );

      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInTS,
        orgTags
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

const fp = require('lodash/fp');

const { partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');

const getLookupResults = (entities, options, requestWithDefaults, Logger) =>
  partitionFlatMap(
    async (_entitiesPartition) => {
      const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(
        _entitiesPartition
      );

      const getEntityLower = fp.flow(
        fp.get('value'),
        fp.toLower
      );

      const entitiesThatExistInTS = await partitionFlatMap(
        async (entities) =>
          fp.getOr(
            [],
            'body.objects',
            await requestWithDefaults({
              url: `${options.url}/api/v2/intelligence`,
              method: 'get',
              qs: {
                username: options.email,
                api_key: options.apiKey,
                value__regexp: fp.flow(
                  fp.map(getEntityLower),
                  fp.join('|')
                )(entities)
              }
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
          uri: `${options.url}/api/v1/orgtag`,
          qs: {
            username: options.email,
            api_key: options.apiKey
          }
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

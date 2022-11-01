const fp = require('lodash/fp');

const { partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');

const getLookupResults = async (entities, options, requestWithDefaults, Logger) => {
  const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(entities);

  const extractValue = fp.flow(fp.get('value'), fp.toLower);

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
            value__regexp: fp.flow(fp.map(extractValue), fp.join('|'))(entities)
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

  const workGroups = fp.getOr(
    [],
    'body.objects',
    await requestWithDefaults({
      uri: `${options.url}/api/v1/workgroup`,
      qs: {
        username: options.email,
        api_key: options.apiKey
      }
    })
  );
  
  const trustedCircles = fp.flow(
    fp.getOr([], 'body.objects'),
    fp.filter(fp.get('member'))
  )(
    await requestWithDefaults({
      uri: `${options.url}/api/v1/trustedcircle`,
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
    orgTags,
    workGroups,
    trustedCircles
  );

  Logger.trace({ lookupResults, entitiesThatExistInTS }, 'Lookup Results');

  return lookupResults.concat(ignoredIpLookupResults);
};

module.exports = {
  getLookupResults
};

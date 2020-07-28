const fp = require('lodash/fp');
const { THREAT_TYPES } = require('./constants');

const createLookupResults = (options, entities, _entitiesThatExistInTS, orgTags) => {
  const entitiesThatExistInTS = fp.filter(
    ({ value }) =>
      fp.any(({ value: _value }) => fp.toLower(value) === fp.toLower(_value), entities),
    _entitiesThatExistInTS
  );
  const notFoundEntities = getNotFoundEntities(entitiesThatExistInTS, entities);
  return [
    {
      entity: { ...entities[0], value: 'Anomali ThreatStream IOC Submission' },
      isVolatile: true,
      data: {
        summary: [
          ...(entitiesThatExistInTS.length
            ? [`Entities Found (${entitiesThatExistInTS.length})`]
            : []),
          ...(notFoundEntities.length ? [`New Entites (${notFoundEntities.length})`] : [])
        ],
        details: {
          url: options.uiUrl,
          entitiesThatExistInTS,
          notFoundEntities,
          orgTags,
          threatTypes: getThreatTypes(entities)
        }
      }
    }
  ];
};

const getNotFoundEntities = (entitiesThatExistInTS, entities) =>
  fp.filter(
    ({ value }) =>
      !fp.any(({ value: _value }) => value === _value, entitiesThatExistInTS),
    entities
  );

const getThreatTypes = fp.flow(
  fp.flatMap(fp.get('types')),
  fp.uniq,
  fp.flatMap((uniqEntityType) => fp.getOr([], uniqEntityType, THREAT_TYPES)),
  fp.uniqBy('type')
);

module.exports = createLookupResults;

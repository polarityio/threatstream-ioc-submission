const fp = require('lodash/fp');
const { THREAT_TYPES } = require('./constants');

let maxUniqueKeyNumber = 0;

const createLookupResults = (options, entities, _entitiesThatExistInTS, orgTags) => {
  const entitiesThatExistInTS = fp.filter(
    ({ value }) =>
      fp.any(({ value: _value }) => fp.toLower(value) === fp.toLower(_value), entities),
    _entitiesThatExistInTS
  );
  const notFoundEntities = getNotFoundEntities(entitiesThatExistInTS, entities);
  const summary = [
    ...(entitiesThatExistInTS.length ? ['Entities Found'] : []),
    ...(notFoundEntities.length ? ['New Entites'] : [])
  ];
  maxUniqueKeyNumber++;

  return [
    {
      entity: { ...entities[0], value: 'ThreatStream IOC Submission' },
      isVolatile: true,
      data: {
        summary,
        details: {
          url: options.uiUrl,
          maxUniqueKeyNumber,
          [`summary${maxUniqueKeyNumber}`]: summary,
          [`entitiesThatExistInTS${maxUniqueKeyNumber}`]: entitiesThatExistInTS,
          [`notFoundEntities${maxUniqueKeyNumber}`]: notFoundEntities,
          [`orgTags${maxUniqueKeyNumber}`]: orgTags,
          [`threatTypes${maxUniqueKeyNumber}`]: getThreatTypes(entities)
        }
      }
    }
  ];
};

const getNotFoundEntities = (entitiesThatExistInTS, entities) =>
  fp.reduce(
    (agg, entity) =>
      !fp.any(
        ({ value }) => fp.lowerCase(entity.value) === fp.lowerCase(value),
        entitiesThatExistInTS
      )
        ? agg.concat({
            ...entity,
            type: fp.includes('IP', entity.type) ? 'ip' : entity.type
          })
        : agg,
    [],
    entities
  );

const getThreatTypes = fp.flow(
  fp.flatMap(fp.get('types')),
  fp.uniq,
  fp.flatMap((uniqEntityType) => fp.getOr([], uniqEntityType, THREAT_TYPES)),
  fp.uniqBy('type')
);

module.exports = createLookupResults;

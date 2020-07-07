const fp = require('lodash/fp');

const createLookupResults = (options, entities) =>
  fp.map((entity) => {
    // const scopes = scopesMap[entity.value];

    const hasResults = fp.some(fp.size);

    const resultsFound = true;
    //hasResults(scopes)

    return {
      entity,
      data: !resultsFound
        ? null
        : {
            summary: _createSummary(entity),
            details: {
              
            }
          }
    };
  })(entities);

const _createSummary = (entity) => {

  return fp.flow(fp.flatten, fp.compact)([]);
};

module.exports = createLookupResults;

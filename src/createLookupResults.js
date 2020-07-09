const fp = require('lodash/fp');

const createLookupResults = (options, entities, entitiesThatExistInTS) =>
  entitiesThatExistInTS.length
    ? [
        {
          entity: { ...entities[0], value: 'Anomali ThreatStream IOC Submission' },
          data: {
            summary: ['Entities Found'],
            details: {
              url: options.uiUrl,
              entitiesThatExistInTS
            }
          }
        }
      ]
    : [];


module.exports = createLookupResults;

'use strict';
const fp = require('lodash/fp');

const validateOptions = require('./src/validateOptions');
const createRequestWithDefaults = require('./src/createRequestWithDefaults');

const { handleError } = require('./src/handleError');
const { getLookupResults } = require('./src/getLookupResults');

let Logger;
let requestWithDefaults;
const startup = (logger) => {
  Logger = logger;
  requestWithDefaults = createRequestWithDefaults(Logger);
};


const doLookup = async (entities, { url, uiUrl, ..._options }, cb) => {
  Logger.debug({ entities }, 'Entities');
  const options = {
    ..._options,
    url: url.endsWith('/') ? url.slice(0, -1) : url,
    uiUrl: uiUrl.endsWith('/') ? uiUrl.slice(0, -1) : uiUrl
  };

  let lookupResults;
  try {
    lookupResults = await getLookupResults(
      entities,
      options,
      requestWithDefaults,
      Logger
    );
  } catch (error) {
    Logger.error({ error }, 'Get Lookup Results Failed');
    return cb(handleError(error));
  }

  Logger.trace({ lookupResults }, 'Lookup Results');
  cb(null, lookupResults);
};

const onMessage = async ({ data: { action, intelId, intelObjects } }, options, callback) => {
  Logger.trace({ test: 'run?', action, intelId });

  if (action === 'deleteItem') {
    if (!intelId) return callback({ title: 'Intel Object ID Not Defined.' });

    try {
      await requestWithDefaults({
        url: `${options.url}/api/v2/intelligence/${intelId}/?username=${options.email}&api_key=${options.apiKey}`,
        method: 'delete'
      });
      return callback(null, { newList: fp.filter(({id}) => id !== intelId, intelObjects) });
    } catch (error) {
      return callback({ title: error });
    }
  }
};

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};

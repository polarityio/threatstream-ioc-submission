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




const onMessage = async ({ data: { action, ...actionParams} }, options, callback) => {
  if (action === 'deleteItem') {
    deleteItem(actionParams, options, Logger, callback);
  } else if (action === 'submitItems') {
    submitItems(actionParams, options, Logger, callback);
  } else if (action === 'getId') {
    submitItems(actionParams, options, Logger, callback);
  } else if (action === 'searchTags') {
    searchTags();
  } else {
    callback(null, {});
  }
};


const deleteItem = async (
  { entity, newIocs, intelObjects },
  options,
  Logger,
  callback
) => {

  let _intelId;
  if (!entity.id) {
    const result = await requestWithDefaults({
      url: `${options.url}/api/v2/intelligence/?username=${options.email}&api_key=${options.apiKey}&value__regexp=${entity.value}`,
      method: 'get'
    });

    _intelId = fp.get('body.objects.0.id', result);
    if (!_intelId)
      //Possibly return error saying to wait as anomali is still processing IOC creation
      return callback(null, {
        newList: fp.filter(({ value }) => value !== entity.value, intelObjects),
        newIocs: [entity, ...newIocs]
      });
  }
  _intelId = _intelId || entity.id;

  try {
    await requestWithDefaults({
      url: `${options.url}/api/v2/intelligence/${_intelId}/?username=${options.email}&api_key=${options.apiKey}`,
      method: 'delete'
    });
  } catch (error) {
    Logger.error({ error }, 'Intel Deletion Error');
  }

  return callback(null, {
    newList: fp.filter(({ value }) => value !== entity.value, intelObjects),
    newIocs: [entity, ...newIocs]
  });
};

const submitItems = async (
  {
    newIocsToSubmit,
    previousEntitiesInTS,
    submitTags,
    submitPublic,
    submitSeverity,
    submitThreatType
  },
  options,
  Logger,
  callback
) => {
  try {
    const creationResults = await Promise.all(
      fp.map(
        (entity) =>
          requestWithDefaults({
            url: `${options.url}/api/v1/intelligence/import/?username=${options.email}&api_key=${options.apiKey}`,
            method: 'POST',
            headers: {
              entity
            },
            formData: {
              tags: JSON.stringify(submitTags),
              classification: submitPublic ? 'public' : 'private',
              threat_type: submitThreatType,
              severity: submitSeverity,
              confidence: (21).toString(),
              datatext: entity.value,
              is_anonymous: 'false',
              expiration_ts: 'null',
              default_state: 'active',
              reject_benign: 'false',
              benign_is_public: 'false',
              tlp: 'green',
              intelligence_source: 'Polarity'
            }
          }),
        newIocsToSubmit
      )
    );

    const { true: newEntities, false: uncreatedEntities } = fp.flow(
      fp.map((successResult) => ({
        ...fp.get('request.headers.entity', successResult),
        success: fp.get('body.success', successResult)
      })),
      fp.groupBy('success')
    )(creationResults);

    return callback(null, {
      entitiesThatExistInTS: [...newEntities, ...previousEntitiesInTS],
      uncreatedEntities
    });
  } catch (error) {
    Logger.trace({ test: 'ERRROR????', error });
    return callback({ err: error, detail: 'Failed to Create Entities' }, {});
  }
};

const searchTags = async () => {
  // try {
  //   //input searchTerm, exclude
  //   //getPreferredTags
  //   let requestOptions = {
  //     uri: `${options.apiUrl}/api/v1/orgtag/`,
  //     qs: {
  //       username: options.username,
  //       api_key: options.apikey,
  //       limit: 500
  //     }
  //   };

  //   Logger.debug({ tags }, 'SEARCH_TAGS result');
  //   cb(null, { tags });
  // } catch (err) {
  //   cb(err);
  // }
  callback(null, {});
};

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};

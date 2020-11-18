const fs = require('fs');
const request = require('request');
const { promisify } = require('util');
const fp = require('lodash/fp');
const config = require('../config/config');

const { checkForInternalServiceError } = require('./handleError');

const _configFieldIsValid = (field) => typeof field === 'string' && field.length > 0;

const createRequestWithDefaults = (Logger) => {
  const {
    request: { ca, cert, key, passphrase, rejectUnauthorized, proxy }
  } = config;

  const defaults = {
    ...(_configFieldIsValid(ca) && { ca: fs.readFileSync(ca) }),
    ...(_configFieldIsValid(cert) && { cert: fs.readFileSync(cert) }),
    ...(_configFieldIsValid(key) && { key: fs.readFileSync(key) }),
    ...(_configFieldIsValid(passphrase) && { passphrase }),
    ...(_configFieldIsValid(proxy) && { proxy }),
    ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized }),
    json: true
  };

  const requestWithDefaults = (
    preRequestFunction = () => ({}),
    postRequestSuccessFunction = (x) => x,
    postRequestFailureFunction = (e) => {
      throw e;
    }
  ) => {
    const _requestWithDefault = promisify(request.defaults(fp.omit('json')(defaults)));
    return async ({ json: bodyWillBeJSON, ...requestOptions }) => {
      const preRequestFunctionResults = await preRequestFunction(requestOptions);
      const _requestOptions = {
        ...requestOptions,
        ...preRequestFunctionResults
      };

      let postRequestFunctionResults;
      try {
        const { body: unformattedBody, ...result } = await _requestWithDefault(
          _requestOptions
        );

        const body =
          (bodyWillBeJSON || defaults.json) && typeof unformattedBody === 'string'
            ? JSON.parse(unformattedBody)
            : unformattedBody;

        checkForStatusError({ body, ...result }, requestOptions);

        postRequestFunctionResults = await postRequestSuccessFunction({
          ...result,
          body
        });
      } catch (error) {
        postRequestFunctionResults = await postRequestFailureFunction(
          error,
          _requestOptions
        );
      }
      return postRequestFunctionResults;
    };
  };

  const checkForStatusError = ({ statusCode, body }, requestOptions) => {
    Logger.trace({ visualLogID: '******************', statusCode, body, requestOptions });
    checkForInternalServiceError(statusCode, body);
    const roundedStatus = Math.round(statusCode / 100) * 100;
    if (roundedStatus !== 200 && roundedStatus !== 300) {
      const requestError = Error('Request Error');
      requestError.status = statusCode;
      requestError.description = body;
      requestError.requestOptions = requestOptions;
      throw requestError;
    }
  };

  return requestWithDefaults();
};

module.exports = createRequestWithDefaults;

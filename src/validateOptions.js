const fp = require('lodash/fp');
const reduce = require('lodash/fp/reduce').convert({ cap: false });

const validateOptions = (options, callback) => {
  const stringOptionsErrorMessages = {
    url: 'You must provide a valid API URL from your Anomali ThreatStream Account',
    uiUrl: 'You must provide a valid UI URL from your Anomali ThreatStream Account',
    email: 'You must provide a valid Email from your Anomali ThreatStream Account',
    apiKey: 'You must provide a valid API Key from your Anomali ThreatStream Account'
  };

  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = _validateUrlOption(options.url);

  callback(null, stringValidationErrors.concat(urlValidationError));
};

const _validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  reduce((agg, message, optionName) => {
    const isString = typeof options[optionName].value === 'string';
    const isEmptyString = isString && fp.isEmpty(options[optionName].value);

    return !isString || isEmptyString
      ? agg.concat({
          key: optionName,
          message
        })
      : agg;
  }, otherErrors)(stringOptionsErrorMessages);

const _validateUrlOption = ({ value: url }, otherErrors = []) =>
  url && url.endsWith('//')
    ? otherErrors.concat({
        key: 'url',
        message: 'Your Url must not end with a //'
      })
    : otherErrors;

module.exports = validateOptions;

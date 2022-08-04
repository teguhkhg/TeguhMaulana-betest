const Ajv = require('ajv').default;
const addFormats = require('ajv-formats');
const emailFormatValidator = require('email-validator');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

ajv.addKeyword({
  keyword: 'isEmailValid',
  type: 'string',
  validate(schema, data) {
    return typeof data === 'string' && emailFormatValidator.validate(data);
  },
  errors: false
});

function schemaValidator(schema, payload) {
  const validate = ajv.compile(schema);
  const isValid = validate(payload);
  return { isValid, validate, ajv };
}

module.exports = schemaValidator;

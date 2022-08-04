const Ajv = require('ajv').default;
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function schemaValidator(schema, payload) {
  const validate = ajv.compile(schema);
  const isValid = validate(payload);
  return { isValid, validate, ajv };
}

module.exports = schemaValidator;

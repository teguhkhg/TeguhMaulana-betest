const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const httpRespStatusUtil = require(`${appRoot}/app/utils/httpRespStatusUtil`);
const schemaValidator = require(`${appRoot}/app/middlewares/ajvValidation`);
const { AddNewUserSchema } = require(`${appRoot}/app/utils/addNewUser.schema`);

function userValidation() {
  function compileBody(req, res, schema, errorMessage, next) {
    try {
      const { isValid, validate, ajv } = schemaValidator(schema, req.body);
      if (!isValid) {
        const errorMsg = `${errorMessage} Invalid Request parameters.`;
        logger.error(`[${req.id}] ${errorMsg} [${ajv.errorsText(validate.errors)}]`);
        return httpRespStatusUtil.sendBadRequest(res, errorMsg);
      }

      return next();
    } catch (error) {
      const errMsg = `${errorMessage}. Validation error.`;
      logger.warn(`[${req.id}] ${errMsg} [Error:${error.message}]`);
      return httpRespStatusUtil.sendBadRequest(res, errMsg);
    }
  }

  function addNewUser(req, res, next) {
    const errorMessage = 'Failed to add new User.';
    return compileBody(req, res, AddNewUserSchema, errorMessage, next);
  }

  return {
    addNewUser
  };
}

module.exports = userValidation;

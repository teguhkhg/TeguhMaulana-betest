const appRoot = require('app-root-path');

const responseBodyFormat = require(`${appRoot}/config/responseBodyConfig`)();

function httpRespStatusUtil() {
  function sendOk(res, data) {
    // Everything worked as expected.
    res.status(200).send(responseBodyFormat.successFormat(data));
  }

  function sendBadRequest(res, data) {
    // The request was unacceptable, often due to missing a required parameter.
    res.status(400).send(responseBodyFormat.errorFormat(data));
  }

  function sendUnauthorized(res, data) {
    // The signature was not valid.
    res.status(401).send(responseBodyFormat.errorFormat(data));
  }

  function sendRequestFailed(res, data) {
    // The parameters were valid but the request failed.
    res.status(403).send(responseBodyFormat.errorFormat(data));
  }

  function sendNotFound(res, data) {
    // The requested resource doesn't exist.
    res.status(404).send(responseBodyFormat.errorFormat(data));
  }

  function sendConflict(res, data) {
    // The request conflicts with another request (perhaps due to using the same idempotent key).
    res.status(409).send(responseBodyFormat.errorFormat(data));
  }

  function sendTooManyRequests(res, data) {
    // Too many requests hit the API too quickly. Either something went wrong or you need to contact us to increase your rate limit.
    res.status(429).send(responseBodyFormat.errorFormat(data));
  }

  function sendServerError(res, data) {
    // Something went wrong on Middleware's end. (These are rare.)
    res.status(500).send(responseBodyFormat.errorFormat(data));
  }

  return {
    sendOk,
    sendBadRequest,
    sendUnauthorized,
    sendRequestFailed,
    sendNotFound,
    sendConflict,
    sendTooManyRequests,
    sendServerError
  };
}

module.exports = httpRespStatusUtil();

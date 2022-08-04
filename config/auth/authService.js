const appRoot = require('app-root-path');
const config = require(`${appRoot}/config/config`);
const jwt = require('jsonwebtoken');
const httpRespStatusUtil = require(`${appRoot}/app/utils/httpRespStatusUtil`);

function authenticator() {
  function authenticate(req, res, next) {
    try {
      if (!req.token) {
        throw new Error('Authorization token not found');
      }

      const ret = jwt.verify(req.token, config.ENCRYPT_KEY);
      if (ret.secret !== config.SECRET) {
        throw new Error('Invalid token');
      }

      return next();
    } catch (error) {
      return httpRespStatusUtil.sendUnauthorized(res, error.message);
    }
  }

  function generate(req, res) {
    try {
      const token = jwt.sign({ secret: config.SECRET }, config.ENCRYPT_KEY, { expiresIn: '3h' });

      return httpRespStatusUtil.sendOk(res, {
        token
      });
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  return {
    authenticate,
    generate
  };
}

module.exports = authenticator();

const appRoot = require('app-root-path');
const logConfig = require(`${appRoot}/config/logConfig`);
const cacheConfig = require(`${appRoot}/config/cacheConfig`);

const config = {
  domain_name: process.env.DOMAIN_NAME,
  port: process.env.PORT || 3000,
  log: logConfig,
  cache: cacheConfig,
};

// Set the current environment or default to 'development'
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
config.ENV = process.env.NODE_ENV;

// Set the Encryption Key
config.ENCRYPT_KEY = process.env.ENCRYPT_KEY;
config.SECRET = process.env.SECRET;

module.exports = config;

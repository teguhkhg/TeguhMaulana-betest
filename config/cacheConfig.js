const toBoolean = require('to-bool');
require('dotenv').config();

const cacheConfig = {
  cache_conn_uri: process.env.CACHE_CONN_URI,
  cache_host: process.env.CACHE_HOST,
  cache_port: process.env.CACHE_PORT,
  cache_password: process.env.CACHE_PASSWORD,
  cache_prefix: `${process.env.CACHE_PREFIX}:`,
  cache_ttl: process.env.CACHE_TTL_SEC,
  cache_ssl: toBoolean(process.env.CACHE_SSL)
};

module.exports = cacheConfig;

require('dotenv').config();

const appRoot = require('app-root-path');
const redis = require('redis');
const bluebird = require('bluebird');

const logger = require(`${appRoot}/config/logger`).defaultLogger;
const cacheConfig = require(`${appRoot}/config/config`).cache;

bluebird.promisifyAll(redis);

let redisClient;

function cacheService() {
  const TOTAL_RETRY_TIME_SEC = 180; // 3 mins
  const TOTAL_RETRY_ATTEMPT = 3;
  const RECONNECT_AFTER_SEC = 8;

  function retryStrategy(options) {
    if (options) {
      logger.debug(`Retrying Cache Connection - attempt:${options.attempt}; total_retry_time:${options.total_retry_time}; times_connected:${options.times_connected}`);
      if (options.error) {
        logger.error(`Cache Connection Error: ${options.error}`);
      }
    }

    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      logger.error('Cache Server Connection Error: The Server refused the connection');
      return new Error('Cache Server Connection Error: The Server refused the connection');
    }
    if (options.total_retry_time > 1000 * TOTAL_RETRY_TIME_SEC) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      logger.error(`Cache Server Connection Error: Total Retry Time Exhausted ${TOTAL_RETRY_TIME_SEC}`);
      return new Error(`Cache Server Connection Error: Total Retry Time Exhausted ${TOTAL_RETRY_TIME_SEC}`);
    }
    if (options.attempt >= TOTAL_RETRY_ATTEMPT) {
      // End reconnecting with built in error
      logger.error(`Cache Server Connection Error: Total Retry Attempts Exhausted (${TOTAL_RETRY_ATTEMPT}).`);
      return new Error(`Cache Server Connection Error: Total Retry Attempts Exhausted (${TOTAL_RETRY_ATTEMPT}).`);
    }
    // reconnect after
    logger.error('Cache Server Connection Error: Re-Attempting Connection...');
    return (1000 * RECONNECT_AFTER_SEC);
  }

  function getConfig() {
    const config = {
      host: cacheConfig.cache_host,
      port: cacheConfig.cache_port,
      password: cacheConfig.cache_password,
      prefix: cacheConfig.cache_prefix,
      retry_strategy: (options) => retryStrategy(options)
    };

    if (cacheConfig.cache_conn_uri) {
      config.url = cacheConfig.cache_conn_uri;
    }

    if (cacheConfig.cache_ssl && !(process.env.REDIS_URL)) {
      config.tls = { checkServerIdentity: () => null };
    }

    return config;
  }

  function getCacheClient() {
    if (!redisClient) {
      const config = getConfig();

      if (process.env.REDIS_URL) { // Only for Heroku-Redis
        redisClient = redis.createClient(process.env.REDIS_URL);
      } else {
        redisClient = redis.createClient(config);
      }
    }
    return redisClient;
  }

  function addTagCache(multi, key, tagList) {
    try {
      // Add the key to each of the tag sets
      tagList.forEach((tag) => {
        multi.sadd(`tags:${tag}`, key);
      });
    } catch (err) {
      logger.error(`Error in adding tag cache: ${err.message}.`);
    }
  }

  async function invalidateCache(tagList) {
    try {
      // eslint-disable-next-line prefer-spread
      const keys = [].concat.apply(
        [],
        await Promise.all(tagList.map((tag) => getCacheClient().smembersAsync(`tags:${tag}`)))
      );

      keys.forEach(async (key) => {
        await getCacheClient().delAsync(key);
      });

      tagList.forEach(async (tag) => {
        await getCacheClient().delAsync(`tags:${tag}`);
      });
    } catch (err) {
      logger.error(`Error in invalidating cache: ${err.message}`);
    }
  }

  async function setCache(key, value, tagList) {
    try {
      const multi = await getCacheClient().multi();

      await invalidateCache([key]);

      if (tagList && tagList.length > 0) {
        addTagCache(multi, key, tagList);
      }

      // eslint-disable-next-line no-unused-vars
      multi.set(`${key}`, value, 'EX', cacheConfig.cache_ttl, (err, result) => {
        if (err) {
          logger.error(`Error in setting Cache for key: ${key} [error: ${err}]`);
        }
      });
      await multi.exec();
    } catch (err) {
      logger.error(`Error in setting cache: ${err.message}.`);
    }
  }

  function delCache(key) {
    getCacheClient().del(key);
  }

  return {
    getCacheClient,
    invalidateCache,
    setCache,
    delCache
  };
}

module.exports = cacheService();

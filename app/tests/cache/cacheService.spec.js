const appRoot = require('app-root-path');
require(`${appRoot}/app/tests/setup`);
require(`${appRoot}/config/config`);
const { expect } = require('chai');
const {
  describe, it, beforeEach, afterEach
} = require('mocha');
const rewire = require('rewire');
const sinon = require('sinon');
const bluebird = require('bluebird');

const cacheService = rewire(`${appRoot}/config/cache/cacheService`);

const sandbox = sinon.createSandbox();

describe('CacheService', () => {
  const cacheConfig = {
    cache_host: 'localhost',
    cache_port: 6379,
    cache_password: 'redis_password',
    cache_prefix: 'ch-test',
    cache_conn_uri: 'www.redis-test.com',
    cache_ssl: true,
  };
  const spyParameter = sandbox.spy();
  const userId = 1;
  let totalRetryTimeSec;
  let totalRetryAttempt;

  function stubRedisCreateClient(methodName) {
    const redisCreateClient = cacheService.__get__('redis');
    const redisStub = sandbox.stub(redisCreateClient, methodName).usingPromise(bluebird.Promise);
    cacheService.__set__('redis', redisCreateClient);
    return redisStub;
  }

  function stubCacheConfig(config) {
    cacheService.__get__('cacheConfig');
    const cacheConfigEx = cacheService.__set__('cacheConfig', config);
    return cacheConfigEx;
  }

  function stubLogger(methodName) {
    const loggerEx = cacheService.__get__('logger');
    const loggerStub = sandbox.stub(loggerEx, methodName);
    cacheService.__set__('logger', loggerEx);
    return loggerStub;
  }

  function stubLoggerError() {
    const errorStub = stubLogger('error');
    errorStub.returns('');
  }

  function stubLoggerDebug() {
    const debugStub = stubLogger('debug');
    debugStub.returns('');
  }

  function stubLoggerAll() {
    stubLoggerError();
    stubLoggerDebug();
  }

  function reset() {
    totalRetryTimeSec = 180; // 3 mins
    totalRetryAttempt = 3;

    // Stub call to logger to prevent excessive logging that slow down the unit-test run
    stubLoggerAll();
  }

  function restore() {
    sandbox.restore();
  }

  beforeEach(reset);
  afterEach(restore);

  describe('getCacheClient', () => {
    it('should return an error if server refused the connection', async () => {
      const options = {
        error: { code: 'ECONNREFUSED' }
      };
      let returnValue;

      const createClientStub = stubRedisCreateClient('createClient');
      createClientStub.callsFake((clientOpts) => {
        returnValue = clientOpts.retry_strategy(options);
      });
      stubCacheConfig(cacheConfig);
      await cacheService.getCacheClient();
      sinon.assert.match(returnValue.message, 'Cache Server Connection Error: The Server refused the connection');
    });

    it('should return an error if total retry time exhausted', async () => {
      const options = {
        total_retry_time: totalRetryTimeSec * 1001,
      };
      let returnValue;

      const createClientStub = stubRedisCreateClient('createClient');
      createClientStub.callsFake((clientOpts) => {
        returnValue = clientOpts.retry_strategy(options);
      });
      stubCacheConfig(cacheConfig);
      await cacheService.getCacheClient();
      sinon.assert.match(returnValue.message, 'Cache Server Connection Error: Total Retry Time Exhausted 180');
    });

    it('should return an error if total retry attempts exhausted', async () => {
      const options = {
        attempt: totalRetryAttempt + userId,
      };
      let returnValue;

      const createClientStub = stubRedisCreateClient('createClient');
      createClientStub.callsFake((clientOpts) => {
        returnValue = clientOpts.retry_strategy(options);
      });
      stubCacheConfig(cacheConfig);
      await cacheService.getCacheClient();
      sinon.assert.match(returnValue.message, 'Cache Server Connection Error: Total Retry Attempts Exhausted (3)');
    });

    it('should return reconnect time in second', async () => {
      const options = {
        attempt: totalRetryAttempt - userId,
      };
      let returnValue;

      const createClientStub = stubRedisCreateClient('createClient');
      createClientStub.callsFake((clientOpts) => {
        returnValue = clientOpts.retry_strategy(options);
      });
      stubCacheConfig(cacheConfig);
      await cacheService.getCacheClient();
      sinon.assert.match(returnValue, 8000);
    });

    it('should return redisClient', async () => {
      const redisClient = {
        set: () => { },
        get: () => { },
        del: () => { },
      };
      const createClientStub = stubRedisCreateClient('createClient');
      createClientStub.callsFake(() => redisClient);
      stubCacheConfig(cacheConfig);
      const result = await cacheService.getCacheClient();
      expect(result).to.have.all.keys('set', 'get', 'del');
    });
  });

  describe('setCache', () => {
    it('should set cache according to its parameters (key, value, ttl)', async () => {
      const redisCreateClient = {
        smembersAsync: sandbox.stub().resolves(1),
        delAsync: sandbox.stub().resolves('OK'),
        multi: sandbox.stub().callsFake(() => ({
          set: (key, value, ex, ttl, callback) => {
            spyParameter(key, value, ex, ttl);
            callback(null, 'OK');
          },
          sadd: sandbox.stub().returns(1),
          exec: sandbox.stub()
        }))
      };
      cacheService.__set__('redisClient', redisCreateClient);

      stubCacheConfig(cacheConfig);

      await cacheService.setCache('userId', 1);

      expect(spyParameter.calledWith('userId', userId, 'EX', undefined)).to.be.ok;
    });

    it('should set cache according to its parameters (key, value, ttl) and set tags', async () => {
      const redisCreateClient = {
        smembersAsync: sandbox.stub().resolves(1),
        delAsync: sandbox.stub().resolves('OK'),
        multi: sandbox.stub().callsFake(() => ({
          set: (key, value, ex, ttl, callback) => {
            spyParameter(key, value, ex, ttl);
            callback(null, 'OK');
          },
          sadd: sandbox.stub().returns(1),
          exec: sandbox.stub()
        }))
      };
      cacheService.__set__('redisClient', redisCreateClient);

      stubCacheConfig(cacheConfig);

      await cacheService.setCache('userId', 1, ['userId:1']);

      expect(spyParameter.calledWith('userId', userId, 'EX', undefined)).to.be.ok;
    });
  });

  describe('delCache', () => {
    it('it should delete the cache according to its key', async () => {
      const delClient = {
        del: (key) => {
          spyParameter(key);
        }
      };
      cacheService.__set__('redisClient', delClient);

      await cacheService.delCache('userId');

      expect(spyParameter.calledWith('userId')).to.be.ok;
    });
  });
});

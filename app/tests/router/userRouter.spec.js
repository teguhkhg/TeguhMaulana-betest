const appRoot = require('app-root-path');
const express = require('express');
const bearerToken = require('express-bearer-token');
const rewire = require('rewire');
const sinon = require('sinon');
const requestId = require('express-request-id')();
const supertest = require('supertest');
const {
  describe, it, beforeEach, afterEach
} = require('mocha');
const { expect } = require('chai');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const config = require(`${appRoot}/config/config`);

require(`${appRoot}/app/tests/setup`);
require(`${appRoot}/config/config`);

const UserController = rewire(`${appRoot}/app/controllers/userController`);
const userRouter = require(`${appRoot}/app/routes/userRouter`);
const sandbox = sinon.createSandbox();

describe('UserRouter', () => {
  let app;
  let user;
  let request;
  let accessToken;

  const TOKEN_NOT_FOUND = 'Authorization token not found';
  const TOKEN_AUTHENTICATION_ERROR = 'Token Authentication Error';
  const invalidAccessToken = 'test';
  const INVALID_REQUEST = 'Invalid Request parameters.';

  function stubUserRepo(methodName) {
    const repo = UserController.__get__('userRepo');
    const repoStub = sandbox.stub(repo, methodName);
    UserController.__set__('userRepo', repo);
    return repoStub;
  }

  function stubLogger(methodName) {
    const logger = UserController.__get__('logger');
    const loggerStub = sandbox.stub(logger, methodName);
    UserController.__set__('logger', logger);
    return loggerStub;
  }

  function stubLoggerError() {
    const errorStub = stubLogger('error');
    errorStub.returns('');
  }

  function stubLoggerInfo() {
    const infoStub = stubLogger('info');
    infoStub.returns('');
  }

  function stubLoggerDebug() {
    const debugStub = stubLogger('debug');
    debugStub.returns('');
  }

  function stubLoggerWarn() {
    const warnStub = stubLogger('warn');
    warnStub.returns('');
  }

  function stubLoggerAll() {
    stubLoggerInfo();
    stubLoggerDebug();
    stubLoggerWarn();
    stubLoggerError();
  }

  function reset() {
    // Create an express application object
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(bearerToken());

    user = {
      _id: 1,
      username: 'test',
      email: 'test@test.com',
      account_number: 1,
      identity_number: 1
    };

    accessToken = jwt.sign({ secret: config.SECRET }, config.ENCRYPT_KEY, { expiresIn: '3h' });

    // 'express-request-id': Generate UUID for request and add it to X-Request-Id header.
    // In case request contains X-Request-Id header, uses its value instead.
    app.use(requestId);

    // Bind a route to our application
    userRouter(app);

    // Get a supertest instance so we can make requests
    request = supertest(app);

    // Stub call to logger to prevent excessive logging that slow down the unit-test run
    stubLoggerAll();
  }

  function restore() {
    sandbox.restore();
  }

  describe('POST /user', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 401 if no token is found in request', async () => {
      await request
        .post('/user')
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_NOT_FOUND);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 401 if token is invalid', async () => {
      await request
        .post('/user')
        .set('Authorization', `Bearer ${invalidAccessToken}`)
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_AUTHENTICATION_ERROR);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 400 if email is invalid', async () => {
      await request
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          email: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if username is invalid', async () => {
      await request
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          username: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if account_number is invalid', async () => {
      await request
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          account_number: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if identity_number is invalid', async () => {
      await request
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          identity_number: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 200 if request success', async () => {
      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('insertNew').returns(user);

      await request
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(user)
        .expect(200);
    });
  });

  describe('GET /users', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 401 if no token is found in request', async () => {
      await request
        .get('/users')
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_NOT_FOUND);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 401 if token is invalid', async () => {
      await request
        .get('/users')
        .set('Authorization', `Bearer ${invalidAccessToken}`)
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_AUTHENTICATION_ERROR);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 200 if identity_number is invalid', async () => {
      stubUserRepo('getAllUser').returns([user]);

      await request
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .expect(200);
    });
  });

  describe('PUT /user', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 401 if no token is found in request', async () => {
      await request
        .put('/user?userId=1')
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_NOT_FOUND);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 401 if token is invalid', async () => {
      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${invalidAccessToken}`)
        .set('Content-Type', 'application/json')
        .expect((res) => {
          res.body.message.should.contain(TOKEN_AUTHENTICATION_ERROR);
          expect(res.statusCode).to.equal(401);
        });
    });

    it('should return 400 if email is invalid', async () => {
      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          email: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if username is invalid', async () => {
      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          username: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if account_number is invalid', async () => {
      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          account_number: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 400 if identity_number is invalid', async () => {
      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send({
          ...user,
          identity_number: null
        })
        .expect((res) => {
          res.body.message.should.contain(INVALID_REQUEST);
          expect(res.statusCode).to.equal(400);
        });
    });

    it('should return 200 if request success', async () => {
      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('insertNew').returns(user);

      await request
        .put('/user?userId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(user)
        .expect(200);
    });
  });
});

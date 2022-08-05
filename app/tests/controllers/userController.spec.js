const appRoot = require('app-root-path');
require(`${appRoot}/app/tests/setup`);
require(`${appRoot}/config/config`);

const {
  describe, it, beforeEach, afterEach
} = require('mocha');
const { expect } = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');
const axios = require('axios');
const { random } = require('faker');
const MockAdapter = require('axios-mock-adapter');

const UserController = rewire(`${appRoot}/app/controllers/userController`);
const userController = UserController();
const sandbox = sinon.createSandbox();

describe('UserController', () => {
  let mock;
  let requestId;
  let req;
  let res;
  let user;

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
  }

  function assertResponse(status, response) {
    response.status.calledWith(status).should.be.true;
  }

  function reset() {
    mock = new MockAdapter(axios);

    requestId = random.uuid();
    req = { id: requestId, body: {}, query: {} };

    user = {
      _id: 1,
      username: 'test',
      email: 'test@test.com',
      account_number: 1,
      identity_number: 1
    };

    res = {
      statusCode: 200,
      header() { },
      send() { },
      status(responseStatus) {
        this.statusCode = responseStatus;
        return this; // return 'this' to make it chainable
      },
      sendStatus(responseStatus) {
        this.status(responseStatus).send();
      }
    };

    // Stub call to logger to prevent excessive logging that slow down the unit-test run
    stubLoggerAll();
  }

  function restore() {
    mock.restore();
    sandbox.restore();
  }

  describe('addNewUser', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 403 if identic user found', async () => {
      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Identic user found.';

      stubUserRepo('getIdenticUserFromDB').returns(user);

      await userController.addNewUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if failed to create user', async () => {
      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to create user.';

      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('insertNew').returns(null);

      await userController.addNewUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      sandbox.spy(res, 'status');
      const sendSpy = sinon.spy(res, 'send');

      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('insertNew').returns(user);

      await userController.addNewUser(req, res);
      expect(JSON.stringify(sendSpy.getCall(0).args[0])).to.eql(JSON.stringify(user));
      assertResponse(200, res);
    });
  });

  describe('getUserList', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 403 if failed to get users', async () => {
      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to get users.';

      stubUserRepo('getAllUser').returns(null);

      await userController.getUserList(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      sandbox.spy(res, 'status');
      const sendSpy = sinon.spy(res, 'send');

      stubUserRepo('getAllUser').returns([user]);

      await userController.getUserList(req, res);
      expect(JSON.stringify(sendSpy.getCall(0).args[0])).to.eql(JSON.stringify([user]));
      assertResponse(200, res);
    });
  });

  describe('getUserWithQuery', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 403 if both account number and identity number supplied', async () => {
      req.query = {
        account_number: 1,
        identity_number: 1
      };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Unable to find by both account number and identity number. Please choose one.';

      await userController.getUserWithQuery(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if account number and identity number is not valid', async () => {
      req.query = {};

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Please enter a valid account number or a valid identity number.';

      await userController.getUserWithQuery(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if failed to get user with account number', async () => {
      req.query = {
        account_number: 1,
      };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to get user.';

      stubUserRepo('getUserByAccountNumber').returns(null);

      await userController.getUserWithQuery(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      req.query = {
        account_number: 1,
      };

      sandbox.spy(res, 'status');
      const sendSpy = sinon.spy(res, 'send');

      stubUserRepo('getUserByAccountNumber').returns(user);

      await userController.getUserWithQuery(req, res);
      expect(JSON.stringify(sendSpy.getCall(0).args[0])).to.eql(JSON.stringify(user));
      assertResponse(200, res);
    });

    it('should return 403 if failed to get user with account number', async () => {
      req.query = {
        identity_number: 1,
      };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to get user.';

      stubUserRepo('getUserByIdentityNumber').returns(null);

      await userController.getUserWithQuery(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      req.query = {
        identity_number: 1,
      };

      sandbox.spy(res, 'status');
      const sendSpy = sinon.spy(res, 'send');

      stubUserRepo('getUserByIdentityNumber').returns(user);

      await userController.getUserWithQuery(req, res);
      expect(JSON.stringify(sendSpy.getCall(0).args[0])).to.eql(JSON.stringify(user));
      assertResponse(200, res);
    });
  });

  describe('addNewUser', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 403 if userId is invalid', async () => {
      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Invalid User.';

      await userController.updateUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if identic user found', async () => {
      req.query = { userId: 1 };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Identic user found.';

      stubUserRepo('getIdenticUserFromDB').returns(user);

      await userController.updateUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if failed to update user', async () => {
      req.query = { userId: 1 };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to update user.';

      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('updateUser').returns(null);

      await userController.updateUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      req.query = { userId: 1 };

      sandbox.spy(res, 'status');
      const sendSpy = sinon.spy(res, 'send');

      stubUserRepo('getIdenticUserFromDB').returns(null);
      stubUserRepo('updateUser').returns(user);

      await userController.updateUser(req, res);
      expect(JSON.stringify(sendSpy.getCall(0).args[0])).to.eql(JSON.stringify(user));
      assertResponse(200, res);
    });
  });

  describe('deleteUser', async () => {
    beforeEach(reset);
    afterEach(restore);

    it('should return 403 if userId is invalid', async () => {
      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Invalid User.';

      await userController.deleteUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 403 if failed to get user', async () => {
      req.query = { userId: 1 };

      sandbox.spy(res, 'status');
      const logStub = stubLogger('error');
      const expectedError = 'Failed to delete user.';

      stubUserRepo('deleteUserById').returns(null);

      await userController.deleteUser(req, res);
      const errorLog = logStub.firstCall.args[0];
      expect(errorLog).to.contain(expectedError);
      assertResponse(403, res);
    });

    it('should return 200 if request successfull', async () => {
      req.query = { userId: 1 };

      sandbox.spy(res, 'status');

      stubUserRepo('deleteUserById').returns(user);

      await userController.deleteUser(req, res);
      assertResponse(200, res);
    });
  });
});

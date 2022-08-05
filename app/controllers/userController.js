const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const userRepo = require(`${appRoot}/app/repositories/userRepository`)();
const httpRespStatusUtil = require(`${appRoot}/app/utils/httpRespStatusUtil`);

function userController() {
  async function addNewUser(req, res) {
    try {
      const tag = 'Add-new-user';
      const requestId = req.id;
      const {
        email,
        username,
        identity_number: identityNumber,
        account_number: accountNumber
      } = req.body;

      logger.debug(`[${requestId}] Attempting ${tag}. [EmailAddress: ${email}]`);

      const user = {
        email,
        accountNumber,
        identityNumber,
        username
      };

      const identicUser = await userRepo.getIdenticUserFromDB(requestId, user);
      if (identicUser) {
        const errorMsg = 'Identic user found.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [EmailAddress: ${email}]`);
        throw new Error(errorMsg);
      }

      const newUser = await userRepo.insertNew(requestId, user);
      if (!newUser) {
        const errorMsg = 'Failed to create user.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [EmailAddress: ${email}]`);
        throw new Error(errorMsg);
      }

      logger.debug(`[${requestId}] ${tag} success. [EmailAddress: ${email}]`);
      return httpRespStatusUtil.sendOk(res, newUser);
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  async function getUserList(req, res) {
    try {
      const tag = 'Get-all-user';
      const requestId = req.id;

      logger.debug(`[${requestId}] Attempting ${tag}.`);

      const users = await userRepo.getAllUser(requestId);
      if (!users) {
        const errorMsg = 'Failed to get users.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg}`);
        throw new Error(errorMsg);
      }

      logger.debug(`[${requestId}] ${tag} success.`);
      return httpRespStatusUtil.sendOk(res, users);
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  async function getUserWithQuery(req, res) {
    try {
      const tag = 'Get-user-with-query';
      const {
        account_number: accountNumber,
        identity_number: identityNumber
      } = req.query;
      const requestId = req.id;

      logger.debug(`[${requestId}] Attempting ${tag}. [AccountNumber: ${accountNumber}, IdentityNumber: ${identityNumber}]`);

      if (accountNumber && identityNumber) {
        const errorMsg = 'Unable to find by both account number and identity number. Please choose one.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [AccountNumber: ${accountNumber}, IdentityNumber: ${identityNumber}]`);
        throw new Error(errorMsg);
      }

      let user;
      let field;
      const account = Number(accountNumber);
      const identity = Number(identityNumber);
      if (account) {
        field = `[AccountNumber: ${accountNumber}]`;
        user = await userRepo.getUserByAccountNumber(requestId, accountNumber);
      } else if (identity) {
        field = `[IdentityNumber: ${identityNumber}]`;
        user = await userRepo.getUserByIdentityNumber(requestId, identityNumber);
      } else {
        const errorMsg = 'Please enter a valid account number or a valid identity number.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [AccountNumber: ${accountNumber}, IdentityNumber: ${identityNumber}]`);
        throw new Error(errorMsg);
      }

      if (!user) {
        const errorMsg = 'Failed to get user.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} ${field}`);
        throw new Error(errorMsg);
      }

      logger.debug(`[${requestId}] ${tag} success. ${field}`);
      return httpRespStatusUtil.sendOk(res, user);
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  async function updateUser(req, res) {
    try {
      const tag = 'Update-user';
      const requestId = req.id;
      const { userId } = req.query;
      const {
        email,
        username,
        identity_number: identityNumber,
        account_number: accountNumber
      } = req.body;

      logger.debug(`[${requestId}] Attempting ${tag}. [UserId: ${userId}]`);

      if (!userId) {
        const errorMsg = 'Invalid User.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [UserId: ${userId}]`);
        throw new Error(errorMsg);
      }

      const user = {
        email,
        accountNumber,
        identityNumber,
        username
      };

      const identicUser = await userRepo.getIdenticUserFromDB(requestId, user, userId);
      if (identicUser) {
        const errorMsg = 'Identic user found.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [UserId: ${userId}]`);
        throw new Error(errorMsg);
      }

      const updatedUser = await userRepo.updateUser(requestId, user, userId);
      if (!updatedUser) {
        const errorMsg = 'Failed to update user.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [UserId: ${userId}]`);
        throw new Error(errorMsg);
      }

      logger.debug(`[${requestId}] ${tag} success. [UserId: ${userId}]`);
      return httpRespStatusUtil.sendOk(res, updatedUser);
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  async function deleteUser(req, res) {
    try {
      const tag = 'Delete-user';
      const { userId } = req.query;
      const requestId = req.id;

      logger.debug(`[${requestId}] Attempting ${tag}. [UserId: ${userId}]`);

      if (!userId) {
        const errorMsg = 'Invalid User.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [UserId: ${userId}]`);
        throw new Error(errorMsg);
      }

      const user = await userRepo.deleteUserById(requestId, userId);
      if (!user) {
        const errorMsg = 'Failed to delete user.';
        logger.error(`[${requestId}] Error in ${tag}. ${errorMsg} [UserId: ${userId}]`);
        throw new Error(errorMsg);
      }

      logger.debug(`[${requestId}] ${tag} success. [UserId: ${userId}]`);
      return httpRespStatusUtil.sendOk(res);
    } catch (error) {
      return httpRespStatusUtil.sendRequestFailed(res, error.message);
    }
  }

  return {
    addNewUser,
    getUserList,
    getUserWithQuery,
    updateUser,
    deleteUser
  };
}

module.exports = userController;

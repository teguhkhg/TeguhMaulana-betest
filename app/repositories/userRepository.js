const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const User = require(`${appRoot}/app/models/userModel`);
const cacheService = require(`${appRoot}/config/cache/cacheService`);

function userRepositories() {
  const MODEL_NAME = 'User';

  function getTagList({ accountNumber, identityNumber }) {
    return [`${MODEL_NAME}.AccountNumber:${accountNumber}`, `${MODEL_NAME}.IdentityNumber:${identityNumber}`];
  }

  function invalidateUserCache(accountNumber, identityNumber) {
    return cacheService.invalidateCache(getTagList({ accountNumber, identityNumber }));
  }

  async function insertNew(requestId, {
    email,
    accountNumber,
    identityNumber,
    username
  }) {
    logger.debug(`[${requestId}] Inserting a ${MODEL_NAME} into DB. [EmailAddress: ${email}]`);

    const user = new User({
      email,
      account_number: accountNumber,
      identity_number: identityNumber,
      username
    });

    const result = user.save().then((data) => {
      logger.debug(`[${requestId}] Successfully inserted a ${MODEL_NAME} to DB. [EmailAddress: ${email}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to insert a new ${User} to DB. [EmailAddress: ${email}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getIdenticUserFromDB(requestId, {
    email,
    accountNumber,
    identityNumber,
    username
  }, userId = null) {
    logger.debug(`[${requestId}] Finding an identic ${MODEL_NAME} from DB. [EmailAddress: ${email}; AccountNumber: ${accountNumber}; IdentityNumber: ${identityNumber}]`);

    let where = {
      $or: [
        { email },
        { account_number: accountNumber },
        { identity_number: identityNumber },
        { username }
      ]
    };
    if (userId) {
      where = {
        $and: [
          { ne: { _id: userId } },
          { ...where }
        ]
      };
    }

    const result = User.findOne(where, (error, data) => {
      if (error) {
        logger.debug(`[${requestId}] Failed to get identic ${MODEL_NAME} from DB. [EmailAddress: ${email}; AccountNumber: ${accountNumber}; IdentityNumber: ${identityNumber}]; [${JSON.stringify(error.message)}]`);
        return null;
      }

      if (data) {
        logger.debug(`[${requestId}] Found an identic ${MODEL_NAME} from DB. [EmailAddress: ${email}; AccountNumber: ${accountNumber}; IdentityNumber: ${identityNumber}]`);
        return data;
      }

      logger.debug(`[${requestId}] Identic ${MODEL_NAME} not found in DB. [EmailAddress: ${email}; AccountNumber: ${accountNumber}; IdentityNumber: ${identityNumber}]`);
      return null;
    });

    return result;
  }

  async function getAllUser(requestId) {
    logger.debug(`[${requestId}] Getting all ${MODEL_NAME} from DB.`);

    const result = User.find().then((data) => {
      logger.debug(`[${requestId}] Successfully got all ${MODEL_NAME} from DB.`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get all ${MODEL_NAME} from DB. [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getUserByAccountNumberFromDB(requestId, accountNumber) {
    logger.debug(`[${requestId}] Getting ${MODEL_NAME} by id from DB. [AccountNumber: ${accountNumber}]`);

    const result = User.findOne({ account_number: accountNumber }).then((data) => {
      cacheService.setCache(`${MODEL_NAME}.AccountNumber:${accountNumber}`, JSON.stringify(data), [getTagList({ accountNumber })[0]]);
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [AccountNumber: ${accountNumber}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get ${MODEL_NAME} by idfrom DB. [AccountNumber: ${accountNumber}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getUserByAccountNumber(requestId, accountNumber) {
    logger.debug(`[${requestId}] Attempting ${MODEL_NAME} retrieval from Cache [AccountNumber: ${accountNumber}]`);

    return cacheService.getCacheClient().getAsync(`${MODEL_NAME}.AccountNumber:${accountNumber}`)
      .then(async (result) => {
        if (result) {
          logger.debug(`[${requestId}] Retrieved ${MODEL_NAME} result from Cache [AccountNumber: ${accountNumber}]`);
          return JSON.parse(result);
        }
        const dbResult = await getUserByAccountNumberFromDB(requestId, accountNumber);
        return JSON.parse(JSON.stringify(dbResult));
      })
      .catch(async (error) => {
        logger.error(`[${requestId}] Error in Cache retrieval for ${MODEL_NAME}. ${error} [AccountNumber: ${accountNumber}];`);
        const dbResult = await getUserByAccountNumberFromDB(requestId, accountNumber);
        return JSON.parse(JSON.stringify(dbResult));
      });
  }

  async function getUserByIdentityNumberFromDB(requestId, identityNumber) {
    logger.debug(`[${requestId}] Getting ${MODEL_NAME} by id from DB. [IdentityNumber: ${identityNumber}]`);

    const result = User.findOne({ identity_number: identityNumber }).then((data) => {
      cacheService.setCache(`${MODEL_NAME}.IdentityNumber:${identityNumber}`, JSON.stringify(data), [getTagList({ identityNumber })[0]]);
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [IdentityNumber: ${identityNumber}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get ${MODEL_NAME} by idfrom DB. [IdentityNumber: ${identityNumber}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getUserByIdentityNumber(requestId, identityNumber) {
    logger.debug(`[${requestId}] Attempting ${MODEL_NAME} retrieval from Cache [IdentityNumber: ${identityNumber}]`);

    return cacheService.getCacheClient().getAsync(`${MODEL_NAME}.IdentityNumber:${identityNumber}`)
      .then(async (result) => {
        if (result) {
          logger.debug(`[${requestId}] Retrieved ${MODEL_NAME} result from Cache [IdentityNumber: ${identityNumber}]`);
          return JSON.parse(result);
        }
        const dbResult = await getUserByIdentityNumberFromDB(requestId, identityNumber);
        return JSON.parse(JSON.stringify(dbResult));
      })
      .catch(async (error) => {
        logger.error(`[${requestId}] Error in Cache retrieval for ${MODEL_NAME}. ${error} [IdentityNumber: ${identityNumber}];`);
        const dbResult = await getUserByIdentityNumberFromDB(requestId, identityNumber);
        return JSON.parse(JSON.stringify(dbResult));
      });
  }

  async function updateUser(requestId, {
    email,
    accountNumber,
    identityNumber,
    username
  }, userId) {
    logger.debug(`[${requestId}] Updating a ${MODEL_NAME} into DB. [UserId: ${userId}]`);

    const result = User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          email,
          account_number: accountNumber,
          identity_number: identityNumber,
          username
        }
      },
      { upsert: true }
    ).then(async (data) => {
      await invalidateUserCache(userId);
      logger.debug(`[${requestId}] Successfully updated a ${MODEL_NAME} to DB. [UserId: ${userId}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to update a new ${User} to DB. [UserId: ${userId}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function deleteUserById(requestId, userId) {
    logger.debug(`[${requestId}] Getting ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);

    const result = User.findByIdAndRemove({ _id: userId }).then((data) => {
      cacheService.delCache(`${MODEL_NAME}.Id:${userId}`);
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to delete ${MODEL_NAME} by id from DB. [UserId: ${userId}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  return {
    insertNew,
    getIdenticUserFromDB,
    getAllUser,
    getUserByAccountNumber,
    getUserByIdentityNumber,
    updateUser,
    deleteUserById
  };
}

module.exports = userRepositories;

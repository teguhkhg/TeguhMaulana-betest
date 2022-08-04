const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const User = require(`${appRoot}/app/models/userModel`);
const cacheService = require(`${appRoot}/config/cache/cacheService`);

function userRepositories() {
  const MODEL_NAME = 'User';

  function getTagList({ userId }) {
    return [`${MODEL_NAME}.Id:${userId}`];
  }

  function invalidateUserCache(userId) {
    return cacheService.invalidateCache(getTagList({ userId }));
  }

  async function insertNew(requestId, userData) {
    logger.debug(`[${requestId}] Inserting a ${MODEL_NAME} into DB. [EmailAddress: ${userData.email}]`);

    const user = new User({
      username: userData.username,
      accountNumber: userData.accountNumber,
      emailAddress: userData.email,
      identityNumber: userData.identityNumber
    });

    const result = user.save().then((data) => {
      logger.debug(`[${requestId}] Successfully inserted a ${MODEL_NAME} to DB. [EmailAddress: ${userData.email}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to insert a new ${User} to DB. [EmailAddress: ${userData.email}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getIdenticUserFromDB(requestId, userData, userId = null) {
    logger.debug(`[${requestId}] Finding an identic ${MODEL_NAME} from DB. [EmailAddress: ${userData.email}; AccountNumber: ${userData.accountNumber}; IdentityNumber: ${userData.identityNumber}]`);

    let where = {
      $or: [
        { emailAddress: userData.email },
        { accountNumber: userData.accountNumber },
        { identityNumber: userData.identityNumber },
        { username: userData.username }
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
        logger.debug(`[${requestId}] Failed to get identic ${MODEL_NAME} from DB. [EmailAddress: ${userData.email}; AccountNumber: ${userData.accountNumber}; IdentityNumber: ${userData.identityNumber}]; [${JSON.stringify(error.message)}]`);
        return null;
      }

      if (data) {
        logger.debug(`[${requestId}] Found an identic ${MODEL_NAME} from DB. [EmailAddress: ${userData.email}; AccountNumber: ${userData.accountNumber}; IdentityNumber: ${userData.identityNumber}]`);
        return data;
      }

      logger.debug(`[${requestId}] Identic ${MODEL_NAME} not found in DB. [EmailAddress: ${userData.email}; AccountNumber: ${userData.accountNumber}; IdentityNumber: ${userData.identityNumber}]`);
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

  async function getUserByIdFromDB(requestId, userId) {
    logger.debug(`[${requestId}] Getting ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);

    const result = User.findOne({ _id: userId }).then((data) => {
      cacheService.setCache(`${MODEL_NAME}.Id:${userId}`, JSON.stringify(data), [getTagList({ userId })[0]]);
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get ${MODEL_NAME} by idfrom DB. [UserId: ${userId}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  async function getUserById(requestId, userId) {
    logger.debug(`[${requestId}] Attempting ${MODEL_NAME} retrieval from Cache [UserId:${userId}]`);

    return cacheService.getCacheClient().getAsync(`${MODEL_NAME}.Id:${userId}`)
      .then(async (result) => {
        if (result) {
          logger.debug(`[${requestId}] Retrieved ${MODEL_NAME} result from Cache [UserId:${userId}]`);
          return JSON.parse(result);
        }
        const dbResult = await getUserByIdFromDB(requestId, userId);
        return JSON.parse(JSON.stringify(dbResult));
      })
      .catch(async (error) => {
        logger.error(`[${requestId}] Error in Cache retrieval for ${MODEL_NAME}. ${error} [UserId:${userId}];`);
        const dbResult = await this.getLicenseeByIdFromDB(requestId, userId);
        return JSON.parse(JSON.stringify(dbResult));
      });
  }

  async function updateUser(requestId, userData, userId) {
    logger.debug(`[${requestId}] Updating a ${MODEL_NAME} into DB. [UserId: ${userId}]`);

    const user = {
      username: userData.username,
      accountNumber: userData.accountNumber,
      emailAddress: userData.email,
      identityNumber: userData.identityNumber
    };

    const result = User.findOneAndUpdate(
      { _id: userId },
      { $set: user },
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
    getUserById,
    updateUser,
    deleteUserById
  };
}

module.exports = userRepositories;

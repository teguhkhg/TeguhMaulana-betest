const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const User = require(`${appRoot}/app/models/userModel`);

function userRepositories() {
  const MODEL_NAME = 'User';

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

  async function getIdenticUser(requestId, userData, userId = null) {
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

  async function getUserById(requestId, userId) {
    logger.debug(`[${requestId}] Getting ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);

    const result = User.findOne({ _id: userId }).then((data) => {
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get all ${MODEL_NAME} by idfrom DB. [UserId: ${userId}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
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
    ).then((data) => {
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
      logger.debug(`[${requestId}] Successfully got ${MODEL_NAME} by id from DB. [UserId: ${userId}]`);
      return data;
    }).catch((error) => {
      logger.error(`[${requestId}] Failed to get all ${MODEL_NAME} by idfrom DB. [UserId: ${userId}]; [${JSON.stringify(error.message)}]`);
      return null;
    });

    return result;
  }

  return {
    insertNew,
    getIdenticUser,
    getAllUser,
    getUserById,
    updateUser,
    deleteUserById
  };
}

module.exports = userRepositories;

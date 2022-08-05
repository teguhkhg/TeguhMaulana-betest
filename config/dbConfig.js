const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/logger`).defaultLogger;
const mongoose = require('mongoose');

require('dotenv').config();

const {
  DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_CONN_URI
} = process.env;

const connectionString = DB_CONN_URI || `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

module.exports = {
  connect: () => {
    mongoose
      .connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        user: DB_USERNAME,
        pass: DB_PASSWORD,
        authSource: 'admin',
      })
      .then(() => {
        logger.info('Successfully connected to the database');
      })
      .catch((err) => {
        logger.error('Could not connect to the database. Exiting now...', err);
        process.exit(1);
      });
  },
};

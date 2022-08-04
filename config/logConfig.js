const toBoolean = require('to-bool');
const os = require('os');
const appRoot = require('app-root-path');
require('dotenv').config();

const logConfig = {
  log_file_name: `${appRoot}/logs/%DATE%-app.log`,
  log_max_size: '30m',
  log_max_files: 10,
  log_body: toBoolean(process.env.LOG_BODY_REQ_RES),
};

module.exports = logConfig;

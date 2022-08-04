const appRoot = require('app-root-path');
const merge = require('lodash/merge');

/* eslint-disable global-require */
// Load .env settings into process.env
// Will fail silently if no .env file present.
require('dotenv').config();

// Load our own defaults which will grab from process.env
let config = require(`${appRoot}/config/env/defaults`);

// Only try this if we're not on Production
if (process.env.NODE_ENV !== 'production') {
  // Load environment-specific settings
  let localConfig = {};

  try {
    // The environment file might not exist
    localConfig = require(`./env/${config.ENV}`);
    localConfig = localConfig || {};
  } catch (err) {
    localConfig = {};
  }

  // merge the config files
  // localConfig will override defaults
  config = merge({}, config, localConfig);
}

/* eslint-enable global-require */

module.exports = config;

const morgan = require('morgan');
const morganBody = require('morgan-body');
const appRoot = require('app-root-path');
const logConfig = require(`${appRoot}/config/config`).log;
const { getDefaultLogRequestFormat, getDefaultLogResponseFormat } = require(`${appRoot}/config/logger/defaultLogger`);
const defaultLogger = require(`${appRoot}/config/logger/defaultLogger`).getLogger();

function logHandler(app) {
  /* We'll need Morgan to know of the request id we added to the request body */
  morgan.token('id', (req) => req.id);

  // Specify the loggerFormat to be used by Morgan and output to logger.stream
  app.use(morgan(getDefaultLogRequestFormat(), {
    immediate: true, // Log Request
    stream: defaultLogger.stream
  }));

  app.use(morgan(getDefaultLogResponseFormat(), {
    stream: defaultLogger.stream // Log Response
  }));

  if (logConfig.log_body) {
    // Log Request/Response Body
    morganBody(app, {
      noColors: true,
      prettify: false,
      /* logAllReqHeader=true will log All request headers and take precedence over logReqHeaderList */
      logAllReqHeader: false,
      /* logReqHeaderList takes in a list of request headers to be displayed in the log */
      logReqHeaderList: ['host', 'content-length', 'cache-control', 'origin', 'content-type', 'accept'],
      /* logAllResHeader=true will log All response headers and take precedence over logResHeaderList */
      logAllResHeader: false,
      /* logResHeaderList takes in a list of response headers to be displayed in the log */
      logResHeaderList: ['host', 'content-length', 'cache-control', 'origin', 'content-type', 'accept'],
      logReqDateTime: false,
      logReqUserAgent: false,
      maxBodyLength: 20000,
      stream: defaultLogger.stream
    });
  }
}

module.exports = {
  logHandler,
  defaultLogger
};

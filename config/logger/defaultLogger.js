const appRoot = require('app-root-path');
const config = require(`${appRoot}/config/config`);
const logConfig = config.log;
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { printf } = require('winston').format;

function defaultLogger() {
  const loggerName = 'default';

  const logRequestFormat = '[:id] :remote-addr referrer[:referrer] :url :method';
  const logResponseFormat = '[:id] :remote-addr :url :method :status response-time[:response-time] ms';
  const logFileName = logConfig.log_file_name;
  const logMaxSize = logConfig.log_max_size;
  const logMaxFiles = logConfig.log_max_files;

  const timestampFormat = printf((info) => `${info.timestamp} ${info.level}: ${info.message}`);

  function getDefaultLogRequestFormat() {
    return logRequestFormat;
  }

  function getDefaultLogResponseFormat() {
    return logResponseFormat;
  }

  // define the custom settings for each transport (file, console)
  const options = {
    fileOptions: {
      level: logConfig.log_file_level,
      filename: logFileName,
      handleExceptions: true,
      datePattern: 'YYYY-MM-DD',
      maxSize: logMaxSize,
      maxFiles: logMaxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        timestampFormat
      )
    },
    consoleOptions: {
      level: 'debug',
      handleExceptions: true,
      timestamp: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        timestampFormat
      )
    }
  };

  const dailyRotateFileTransport = new DailyRotateFile(options.fileOptions);
  const consoleTransport = new winston.transports.Console(options.consoleOptions);

  const transportList = [dailyRotateFileTransport, consoleTransport];

  // instantiate a new Winston Logger with the settings defined above
  const logger = winston.loggers.add(loggerName, {
    transports: transportList,
    exitOnError: false, // do not exit on handled exceptions
  });

  // create a stream object with a 'write' function that will be used by `morgan`
  logger.stream = {
    // eslint-disable-next-line no-unused-vars
    write: function write(message, encoding) {
      // use the 'info' log level so the output will be picked up by both transports (file and console)
      logger.info(message);
    },
  };

  function getLogger() {
    return winston.loggers.get(loggerName);
  }

  return {
    getDefaultLogRequestFormat,
    getDefaultLogResponseFormat,
    getLogger
  };
}

module.exports = defaultLogger();

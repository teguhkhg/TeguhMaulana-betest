const appRoot = require('app-root-path');
const express = require('express');
const bearerToken = require('express-bearer-token');
const requestId = require('express-request-id')();
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const redis = require('redis');
const config = require(`${appRoot}/config/config`);
require('winston');

const { logHandler, defaultLogger } = require(`${appRoot}/config/logger`);
require(`${appRoot}/config/cache/cacheService`).getCacheClient();
const db = require(`${appRoot}/config/dbConfig`);

const userRouter = require(`${appRoot}/app/routes/userRouter`);
const authRouter = require(`${appRoot}/app/routes/authRouter`);

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bearerToken());

let redisClient;
if (config.cache.cache_conn_uri) {
  redisClient = redis.createClient({
    url: config.cache.cache_conn_uri,
    socket: {
      tls: true,
      rejectUnauthorized: false
    }
  });

  defaultLogger.debug('["REDIS"] Authenticated redis connection');
} else {
  redisClient = redis.createClient({
    host: config.cache.cache_host,
    port: config.cache.cache_port
  });
  redisClient.auth(config.cache.cache_password, (err, response) => {
    if (err) {
      defaultLogger.error(`['REDIS'] Failed to authenticate redis connection; Error:${err.message}`);
    } else {
      defaultLogger.debug(`['REDIS'] Authenticated redis connection; Response:${response}`);
    }
  });
}

app.use(requestId);
logHandler(app);

authRouter(app);
userRouter(app);

function startServer() {
  db.connect();

  if (!process.env.NODE_ENV) {
    defaultLogger.info('Running Server in \'development\' mode');
  } else {
    defaultLogger.info(`Running Server in '${process.env.NODE_ENV}' mode`);
  }

  app.listen(process.env.PORT, async () => {
    defaultLogger.debug(`Listening on port ${process.env.PORT}`);
  });
}

startServer();

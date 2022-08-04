const appRoot = require('app-root-path');
const express = require('express');
const requestId = require('express-request-id')();
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { logHandler, defaultLogger } = require(`${appRoot}/config/logger`);
const db = require(`${appRoot}/config/dbConfig`);

const userRouter = require(`${appRoot}/app/routes/userRouter`);

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(requestId);
logHandler(app);

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

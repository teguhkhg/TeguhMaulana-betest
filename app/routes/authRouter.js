const express = require('express');
const appRoot = require('app-root-path');
const authenticator = require(`${appRoot}/config/auth/authService`);

function userRouter(app) {
  const route = express.Router();

  app.use(route);

  route.get('/token', authenticator.generate);
}

module.exports = userRouter;

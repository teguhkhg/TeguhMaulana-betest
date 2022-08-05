const express = require('express');
const appRoot = require('app-root-path');
const userController = require(`${appRoot}/app/controllers/userController`)();
const authenticator = require(`${appRoot}/config/auth/authService`);
const userValidation = require(`${appRoot}/app/middlewares/userValidation`)();

function userRouter(app) {
  const route = express.Router();

  const {
    addNewUser,
    getUserList,
    getUserWithQuery,
    updateUser,
    deleteUser
  } = userController;

  app.use(route);

  route.post('/user', authenticator.authenticate, userValidation.newUserData, addNewUser);
  route.get('/users', authenticator.authenticate, getUserList);
  route.get('/user', authenticator.authenticate, getUserWithQuery);
  route.put('/user', authenticator.authenticate, userValidation.newUserData, updateUser);
  route.delete('/user', authenticator.authenticate, deleteUser);
}

module.exports = userRouter;

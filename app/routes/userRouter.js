const express = require('express');
const appRoot = require('app-root-path');
const userController = require(`${appRoot}/app/controllers/userController`)();

function userRouter(app) {
  const route = express.Router();

  const {
    addNewUser,
    getUserList,
    getUserById,
    updateUser,
    deleteUser
  } = userController;

  app.use(route);

  route.post('/user', addNewUser);
  route.get('/users', getUserList);
  route.get('/user', getUserById);
  route.put('/user', updateUser);
  route.delete('/user', deleteUser);
}

module.exports = userRouter;

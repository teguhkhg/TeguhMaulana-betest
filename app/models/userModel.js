const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  account_number: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  identity_number: {
    type: Number,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('user', UserSchema);

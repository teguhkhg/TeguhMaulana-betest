const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  account_number: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true
  },
  identity_number: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('user', UserSchema);

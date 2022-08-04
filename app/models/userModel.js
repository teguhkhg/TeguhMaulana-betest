const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: Number,
    required: true,
  },
  emailAddress: {
    type: String,
    required: true
  },
  identityNumber: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('user', UserSchema);

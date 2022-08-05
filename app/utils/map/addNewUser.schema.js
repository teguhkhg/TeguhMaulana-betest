module.exports.AddNewUserSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      isEmailValid: true,
      nullable: false
    },
    account_number: {
      type: 'number',
      nullable: false
    },
    identity_number: {
      type: 'number',
      nullable: false
    },
    username: {
      type: 'string',
      nullable: false
    }
  },
  required: [
    'email', 'account_number', 'identity_number', 'username'
  ]
};

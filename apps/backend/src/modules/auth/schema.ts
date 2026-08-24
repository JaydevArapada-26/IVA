// Module domain validations and schema descriptors
export const authSchema = {
  login: {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string' },
      otp: { type: 'string' },
    },
    required: ['phoneNumber', 'otp'],
  },
};

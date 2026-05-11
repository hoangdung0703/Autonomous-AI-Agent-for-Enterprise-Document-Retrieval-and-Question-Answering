const { body } = require('express-validator');

const generate = [
  body('expiryHours')
    .custom(value => {
      const valid = [1, 6, 24, 168, 720];
      if (!valid.includes(Number(value))) {
        throw new Error('expiryHours must be one of: 1, 6, 24, 168, 720');
      }
      return true;
    }),
  body('maxUsage')
    .isInt({ min: 1, max: 100 })
    .withMessage('maxUsage must be an integer between 1 and 100'),
];

module.exports = { generate };

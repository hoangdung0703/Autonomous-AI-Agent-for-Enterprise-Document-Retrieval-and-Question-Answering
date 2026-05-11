const { body } = require('express-validator');

const create = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Organization name must be between 3 and 100 characters'),
];

module.exports = { create };

const { body } = require('express-validator');

const submit = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Invite code must be exactly 6 characters')
    .isAlphanumeric()
    .withMessage('Invite code must contain only letters and numbers'),
];

module.exports = { submit };

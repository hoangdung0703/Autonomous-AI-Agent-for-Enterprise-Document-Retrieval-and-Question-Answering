const { body } = require('express-validator');

const create = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('documentIds')
    .isArray({ min: 1, max: 10 })
    .withMessage('documentIds must be an array with 1 to 10 items'),
  body('documentIds.*')
    .isMongoId()
    .withMessage('Each documentId must be a valid MongoDB ObjectId'),
];

const query = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Question must be between 3 and 2000 characters'),
];

const rename = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be at most 100 characters'),
];

module.exports = { create, query, rename };

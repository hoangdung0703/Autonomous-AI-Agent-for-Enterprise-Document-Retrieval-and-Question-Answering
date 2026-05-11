const { body } = require('express-validator');

// Post-multer check: ensure a file was actually attached
const upload = [
  body().custom((_, { req }) => {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    return true;
  }),
];

module.exports = { upload };

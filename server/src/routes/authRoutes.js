const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { register, login, forgotPassword, resetPassword } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, validate(register), authController.register);
router.post('/login', authLimiter, validate(login), authController.login);
router.get('/refresh-token', authMiddleware, authController.refreshToken.bind(authController));
router.post('/forgot-password', authLimiter, validate(forgotPassword), authController.forgotPassword.bind(authController));
router.post('/reset-password', authLimiter, validate(resetPassword), authController.resetPassword.bind(authController));



module.exports = router;

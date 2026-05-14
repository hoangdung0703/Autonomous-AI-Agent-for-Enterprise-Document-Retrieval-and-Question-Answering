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

// Test routes for verification
router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'You have access to this protected route', user: req.user });
});

router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ message: 'You have access to this admin route', user: req.user });
});

module.exports = router;

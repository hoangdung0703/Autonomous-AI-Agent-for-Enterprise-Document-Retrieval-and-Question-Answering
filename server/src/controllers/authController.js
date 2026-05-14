const authService = require('../services/AuthService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide name, email, and password');
      }

      const result = await authService.register(name, email, password, role);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'User already exists with this email') {
        res.status(400);
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
      }

      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        res.status(401);
      }
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = await authService.refreshTokenForUser(req.user.id);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      // Always 200 — do not reveal whether email exists
      res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.status(200).json({ message: 'Password reset successful. Please sign in.' });
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }
}

module.exports = new AuthController();

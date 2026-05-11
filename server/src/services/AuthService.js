const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

class AuthService {
  async register(name, email, password, role = 'user') {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    const token = this.generateToken(user);
    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, token };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userResponse = this.sanitizeUser(user);

    return { user: userResponse, token };
  }

  generateToken(user, organizationName = null) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      organizationId: user.organizationId || null,
      organizationName: organizationName,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }

  async refreshTokenForUser(userId) {
    const user = await User.findById(userId).populate('organizationId');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    const orgName = user.organizationId?.name || null;
    return this.generateToken(user, orgName);
  }

  sanitizeUser(user) {
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}

module.exports = new AuthService();

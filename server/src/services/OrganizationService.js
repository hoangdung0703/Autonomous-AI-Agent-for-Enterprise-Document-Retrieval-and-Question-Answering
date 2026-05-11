const crypto = require('crypto');
const Organization = require('../models/Organization');
const User = require('../models/User');
const authService = require('./AuthService');

class OrganizationService {

  // Generate a unique 6-char uppercase hex code (e.g. "A3F9C2")
  async _generateUniqueCode() {
    let code;
    let collision = true;
    while (collision) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      collision = !!(await Organization.findOne({ code }));
    }
    return code;
  }

  async createOrganization({ userId, name }) {
    if (!name || name.trim().length < 3) {
      const err = new Error('Organization name must be at least 3 characters');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    if (user.organizationId) {
      const err = new Error('You already belong to an organization');
      err.statusCode = 400;
      throw err;
    }

    const code = await this._generateUniqueCode();

    const organization = new Organization({
      name: name.trim(),
      code,
      createdBy: userId,
    });
    await organization.save();

    // Update user — becomes admin of this org
    user.organizationId = organization._id;
    user.role = 'admin';
    await user.save();

    // Issue fresh JWT so frontend has organizationId + organizationName immediately
    const token = authService.generateToken(user, organization.name);

    return { organization, token };
  }

  async getOrganization(userId) {
    const user = await User.findById(userId).populate('organizationId');
    return user?.organizationId || null;
  }
}

module.exports = new OrganizationService();

const organizationService = require('../services/OrganizationService');
const User = require('../models/User');

class OrganizationController {

  async create(req, res, next) {
    try {
      const { name } = req.body;
      const result = await organizationService.createOrganization({ userId: req.user.id, name });
      res.status(201).json(result);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const organization = await organizationService.getOrganization(req.user.id);
      const memberCount = await User.countDocuments({ organizationId: req.user.organizationId });
      res.status(200).json({ organization, memberCount });
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req, res, next) {
    try {
      const members = await User.find(
        { organizationId: req.user.organizationId },
        'name email role createdAt'
      ).sort({ createdAt: 1 });
      res.status(200).json({ members });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationController();

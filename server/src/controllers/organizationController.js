const organizationService = require('../services/OrganizationService');

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
      res.status(200).json({ organization });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrganizationController();

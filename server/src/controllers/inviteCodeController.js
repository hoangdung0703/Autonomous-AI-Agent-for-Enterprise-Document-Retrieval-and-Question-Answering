const inviteCodeService = require('../services/InviteCodeService');

class InviteCodeController {
  async generate(req, res, next) {
    try {
      const { expiryHours, maxUsage } = req.body;
      const code = await inviteCodeService.generateCode({
        adminId: req.user.id,
        organizationId: req.organizationId,
        expiryHours,
        maxUsage
      });
      res.status(201).json(code);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const codes = await inviteCodeService.listCodes(req.organizationId);
      res.status(200).json(codes);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const code = await inviteCodeService.deactivateCode({
        codeId: req.params.id,
        organizationId: req.organizationId
      });
      res.status(200).json(code);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await inviteCodeService.deleteCode({
        codeId: req.params.id,
        organizationId: req.organizationId
      });
      res.status(200).json({ message: 'Invite code deleted' });
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }
}

module.exports = new InviteCodeController();

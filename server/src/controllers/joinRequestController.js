const joinRequestService = require('../services/JoinRequestService');

class JoinRequestController {

  async submit(req, res, next) {
    try {
      const { inviteCode } = req.body;
      const result = await joinRequestService.submitRequest({ userId: req.user.id, inviteCode });
      res.status(201).json(result);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const request = await joinRequestService.getMyRequest(req.user.id);
      res.status(200).json({ request });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const requests = await joinRequestService.listPendingRequests(req.organizationId);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const result = await joinRequestService.approveRequest({
        requestId: req.params.id,
        adminId: req.user.id,
        organizationId: req.organizationId,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const result = await joinRequestService.rejectRequest({
        requestId: req.params.id,
        adminId: req.user.id,
        organizationId: req.organizationId,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }
}

module.exports = new JoinRequestController();

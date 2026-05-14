const conversationService = require('../services/ConversationService');

class ConversationController {

  async create(req, res, next) {
    try {
      const { title, documentIds } = req.body;
      const conversation = await conversationService.createConversation({
        userId: req.user.id,
        organizationId: req.organizationId,
        title,
        documentIds,
      });
      res.status(201).json(conversation);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await conversationService.listConversations(req.user.id, req.organizationId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const conversation = await conversationService.getConversation(req.params.id, req.user.id);
      res.status(200).json(conversation);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async rename(req, res, next) {
    try {
      const { title } = req.body;
      const conversation = await conversationService.renameConversation(req.params.id, req.user.id, title);
      res.status(200).json(conversation);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await conversationService.deleteConversation(req.params.id, req.user.id);
      res.status(200).json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async query(req, res, next) {
    try {
      const { question } = req.body;
      const result = await conversationService.queryConversation(req.params.id, req.user.id, question);
      res.status(200).json(result);
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
  }

  async updateDocuments(req, res, next) {
    try {
      const { documentIds } = req.body;
      const conversation = await conversationService.updateDocuments(
        req.params.id,
        req.user.id,
        documentIds
      );
      res.status(200).json({ conversation });
    } catch (error) {
      if (error.status) res.status(error.status);
      next(error);
    }
  }
}

module.exports = new ConversationController();

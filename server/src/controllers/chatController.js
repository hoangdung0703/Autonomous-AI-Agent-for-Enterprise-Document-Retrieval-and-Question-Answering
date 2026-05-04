const ragService = require('../services/RAGService');

class ChatController {
  async query(req, res, next) {
    try {
      const { question } = req.body;

      if (!question || question.trim() === '') {
        res.status(400);
        throw new Error('Question is required');
      }

      const result = await ragService.query(question);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();

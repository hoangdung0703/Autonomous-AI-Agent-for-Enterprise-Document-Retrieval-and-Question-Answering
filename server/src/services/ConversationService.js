const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const ragService = require('./RAGService');

class ConversationService {

  async createConversation({ userId, organizationId, title = 'New Conversation', documentIds = [] }) {
    if (documentIds.length === 0) {
      const err = new Error('At least one document must be selected');
      err.statusCode = 400;
      throw err;
    }

    if (documentIds.length > 10) {
      const err = new Error('A conversation cannot have more than 10 documents');
      err.statusCode = 400;
      throw err;
    }

    // Validate all documentIds exist and are ready within this org
    const docs = await Document.find({ _id: { $in: documentIds }, organizationId });
    if (docs.length !== documentIds.length) {
      const err = new Error('One or more document IDs are invalid or not in your organization');
      err.statusCode = 400;
      throw err;
    }

    const notReady = docs.filter(d => d.status !== 'ready');
    if (notReady.length > 0) {
      const err = new Error(`Documents are not ready yet: ${notReady.map(d => d.originalName).join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const conversation = new Conversation({
      title: title.trim() || 'New Conversation',
      userId,
      organizationId,
      documentIds,
    });

    await conversation.save();
    await conversation.populate('documentIds', '_id originalName status');
    return conversation;
  }

  async listConversations(userId, organizationId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find({ userId, organizationId })
        .populate('documentIds', '_id originalName status')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-messages'),
      Conversation.countDocuments({ userId, organizationId })
    ]);
    return {
      conversations,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId)
      .populate('documentIds', '_id originalName status');

    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    if (conversation.userId.toString() !== userId.toString()) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    return conversation;
  }

  async renameConversation(conversationId, userId, newTitle) {
    if (!newTitle || !newTitle.trim()) {
      const err = new Error('Title cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    const conversation = await this._getOwnedConversation(conversationId, userId);
    conversation.title = newTitle.trim().slice(0, 100);
    conversation.updatedAt = Date.now();
    await conversation.save();
    return conversation;
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await this._getOwnedConversation(conversationId, userId);
    await Conversation.findByIdAndDelete(conversationId);
    return { deleted: true };
  }

  async queryConversation(conversationId, userId, question) {
    if (!question || !question.trim()) {
      const err = new Error('Question cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    const conversation = await this._getOwnedConversation(conversationId, userId);

    // Validate all documents are still ready
    const docs = await Document.find({ _id: { $in: conversation.documentIds } });
    const notReady = docs.filter(d => d.status !== 'ready');
    if (notReady.length > 0) {
      const err = new Error(`Some documents are still processing: ${notReady.map(d => d.originalName).join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // Get previous messages (user message is not yet pushed to the array)
    const historyMessages = conversation.messages.slice(-6);

    // Call RAG with document scope and history
    const { answer, sources } = await ragService.query(question, conversation.documentIds, historyMessages);

    // Persist both messages
    conversation.messages.push({ role: 'user', content: question });
    conversation.messages.push({ role: 'assistant', content: answer, sources });
    conversation.updatedAt = Date.now();
    await conversation.save();

    return { answer, sources };
  }

  // Private helper — fetch conversation and verify ownership
  async _getOwnedConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    if (conversation.userId.toString() !== userId.toString()) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    return conversation;
  }
}

module.exports = new ConversationService();

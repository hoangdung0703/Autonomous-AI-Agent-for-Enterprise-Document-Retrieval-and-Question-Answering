const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // Only populated for assistant messages
  sources: [
    {
      fileName: { type: String },
      chunkIndex: { type: Number }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'New Conversation',
    maxlength: [100, 'Title cannot exceed 100 characters'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    validate: {
      validator: (arr) => arr.length <= 10,
      message: 'A conversation cannot have more than 10 documents'
    }
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);

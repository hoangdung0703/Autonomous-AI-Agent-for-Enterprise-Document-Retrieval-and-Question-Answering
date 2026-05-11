const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ChromaClient } = require('chromadb');
const requestLogger = require('./middleware/requestLogger');
const { globalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const joinRequestRoutes = require('./routes/joinRequestRoutes');
const inviteCodeRoutes = require('./routes/inviteCodeRoutes');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();

// Request logger — must be first
app.use(requestLogger);

// Global rate limiter — applied before all routes
app.use(globalLimiter);

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/invite-codes', inviteCodeRoutes);

app.get('/api/health', async (req, res) => {
  const start = Date.now();

  // Check MongoDB
  const mongoStatus = mongoose.connection.readyState === 1 ? 'ok' : 'error';

  // Check ChromaDB
  let chromaStatus = 'ok';
  try {
    const client = new ChromaClient({ path: env.CHROMA_HOST });
    await client.heartbeat();
  } catch {
    chromaStatus = 'error';
  }

  // Check Gemini API
  let geminiStatus = 'ok';
  try {
    const res2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GOOGLE_API_KEY}`
    );
    if (!res2.ok) geminiStatus = 'error';
  } catch {
    geminiStatus = 'error';
  }

  const allOk = mongoStatus === 'ok' && chromaStatus === 'ok' && geminiStatus === 'ok';

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    responseTime: `${Date.now() - start}ms`,
    services: {
      mongodb: mongoStatus,
      chromadb: chromaStatus,
      gemini: geminiStatus
    }
  });
});

// Unified Error Handler
app.use(errorHandler);

module.exports = app;

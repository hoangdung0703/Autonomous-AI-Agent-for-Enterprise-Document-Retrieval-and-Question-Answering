const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const joinRequestRoutes = require('./routes/joinRequestRoutes');
const inviteCodeRoutes = require('./routes/inviteCodeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Request logger — must be first
app.use(requestLogger);

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Unified Error Handler
app.use(errorHandler);

module.exports = app;

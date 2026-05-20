const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const vectorDB = require('./services/VectorDBService');
const logger = require('./utils/logger');

const startServer = async () => {
  // Connect to MongoDB (blocking — Atlas is always up)
  await connectDB();

  // ChromaDB: connect() fires in background from VectorDBService constructor.
  // Express starts immediately — no blocking on ChromaDB cold start.
  app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();

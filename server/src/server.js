const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const vectorDB = require('./services/VectorDBService');
const logger = require('./utils/logger');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Connect to ChromaDB
  await vectorDB.connect();

  // Start Express server
  app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();

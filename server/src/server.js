const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const vectorDB = require('./services/VectorDBService');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Connect to ChromaDB
  await vectorDB.connect();

  // Start Express server
  app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();

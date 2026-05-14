require('dotenv').config({ path: '../.env' }); // Load from root if running from server, but better to just use dotenv.config() and ensure working dir is correct, or explicitly path to root

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const requiredVars = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'GOOGLE_API_KEY',
  'GEMINI_CHAT_MODEL',
  'GEMINI_EMBEDDING_MODEL',
  'CHROMA_HOST',
  'CHROMA_COLLECTION',
  'MAX_FILE_SIZE_MB',
  'UPLOAD_DIR',
  'RESEND_API_KEY',
  'FRONTEND_URL'
];

for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL,
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL,
  CHROMA_HOST: process.env.CHROMA_HOST,
  CHROMA_COLLECTION: process.env.CHROMA_COLLECTION,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL
};

const NodeCache = require('node-cache');

// TTL: 5 minutes, check expired keys every 2 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

const generateCacheKey = (question, documentIds) => {
  const sortedIds = [...documentIds].map(id => id.toString()).sort().join(',');
  return `rag:${question.trim().toLowerCase()}:${sortedIds}`;
};

module.exports = { cache, generateCacheKey };

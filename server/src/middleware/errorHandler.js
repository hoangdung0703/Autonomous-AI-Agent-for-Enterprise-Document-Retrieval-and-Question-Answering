const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error] ${err.message}`);
  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // 503 — dependency warming up (e.g. ChromaDB cold start)
  if (err.statusCode === 503) {
    res.set('Retry-After', String(err.retryAfter || 30));
    return res.status(503).json({ error: err.message });
  }

  res.status(statusCode).json({
    error: {
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

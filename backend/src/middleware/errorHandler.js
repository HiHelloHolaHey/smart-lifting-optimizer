const config = require('../config');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(err.stack);

  res.status(statusCode).json({
    error: statusCode >= 500 && config.nodeEnv !== 'development' ? 'Internal Server Error' : err.message || 'Internal Server Error',
    ...(err.field && { field: err.field }),
    ...(err.code && { code: err.code }),
    ...(config.nodeEnv === 'development' && statusCode >= 500 && { dev: err.stack }),
  });
};

module.exports = errorHandler;

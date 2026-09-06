const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  logger.error(err.message);
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: status === 500 ? "Internal Server Error" : err.message });
}

module.exports = { errorHandler };

// Wrap async route handlers so thrown errors reach the global error handler
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

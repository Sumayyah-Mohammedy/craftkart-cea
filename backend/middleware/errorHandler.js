// PURPOSE: Handle all errors globally (PostgreSQL + app errors)

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // PostgreSQL error codes -> client-friendly responses
  switch (err.code) {
    case "23505": // unique_violation
      statusCode = 400;
      message = `${(err.constraint || "value").replace(/_key$/, "").split("_").slice(1).join(" ") || "value"} already exists`;
      break;
    case "23514": // check_violation (enum / range constraint)
    case "22P02": // invalid_text_representation (bad uuid / number)
    case "23502": // not_null_violation
      statusCode = 400;
      message = "Invalid or missing field value";
      break;
    case "23503": // foreign_key_violation
      statusCode = 400;
      message = "Referenced resource does not exist";
      break;
    default:
      break;
  }

  if (err.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token expired"; }
  if (err.type === "entity.parse.failed") { statusCode = 400; message = "Malformed JSON body"; }

  if (statusCode >= 500 && process.env.NODE_ENV !== "test") {
    console.error(JSON.stringify({ level: "error", msg: "request failed", path: req.originalUrl, error: err.message, stack: err.stack }));
  }

  res.status(statusCode).json({
    success: false,
    // never leak internal errors in production
    message: statusCode >= 500 && process.env.NODE_ENV === "production" ? "Server Error" : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

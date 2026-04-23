function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.url} - ${statusCode}: ${error.message}`);
    if (statusCode === 500) console.error(error.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || "Something went wrong.", // Keeping 'error' for test compatibility
    message: error.message || "Something went wrong.",
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
}

module.exports = errorHandler;

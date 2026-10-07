const errorHandler = (err, req, res, next) => {
  console.error("Server error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};

module.exports = errorHandler;

export function errorHandler(error, _req, res, _next) {
  console.error("[backend]", error);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}

const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("Authentication error: JWT_SECRET is not configured");

    return res.status(500).json({
      message: "Authentication service is not configured",
    });
  }

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/);

  if (!match) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  try {
    const decoded = jwt.verify(match[1], secret);

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.userId !== "string" ||
      !decoded.userId.trim() ||
      !["customer", "business_owner"].includes(decoded.role)
    ) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (
      error.name !== "TokenExpiredError" &&
      error.name !== "JsonWebTokenError" &&
      error.name !== "NotBeforeError"
    ) {
      console.error("Authentication error:", error.message);

      return res.status(500).json({
        message: "Authentication failed",
      });
    }

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;

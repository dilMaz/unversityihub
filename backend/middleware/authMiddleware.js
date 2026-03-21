const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Bearer token remove
    const cleanToken = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not configured in environment");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(cleanToken, secret);

    req.user = decoded; // user id
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
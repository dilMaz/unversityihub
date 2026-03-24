const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "unihub_dev_secret";

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

    const decoded = jwt.verify(cleanToken, getJwtSecret());

    req.user = decoded; // user id
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
const jwt = require("jsonwebtoken");

const shouldBeLogin = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authenticated now",
    user: req.user,
  });
};

const shouldBeAdmin = async (req, res, next) => {
  try {
    if (req.userRole !== "admin" && req.userRole !== "support") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = { shouldBeAdmin, shouldBeLogin };

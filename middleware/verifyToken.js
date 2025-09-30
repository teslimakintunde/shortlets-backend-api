const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        adminPermissions: true,
        userProfile: {
          select: {
            phone: true,
            bio: true,
            country: true,
            state: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.userId = payload.id;
    req.userRole = user.role;
    req.user = user;

    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json({ success: false, message: "Invalid Token" });
  }
};
module.exports = verifyToken;

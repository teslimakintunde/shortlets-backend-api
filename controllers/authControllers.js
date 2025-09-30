require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "password must be at least 6 characters",
    });
  }

  try {
    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashPassword,
        role: "user", // Default role
        userProfile: {
          create: {}, // Create empty user profile
        },
      },
      include: {
        userProfile: true,
      },
    });

    const { password: _, ...userInfo } = newUser;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userInfo,
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: `This ${error.meta.target} is already taken`,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create user" });
    }
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "username and password are required" });
  }

  try {
    // Find user (now includes all users with roles)
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { password: userPassword, ...userInfo } = user;
    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    // Return response with role information
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: age,
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user: userInfo,
        isAdmin: user.role === "admin" || user.role === "support",
      });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Failed to login" });
  }
};

const logout = async (req, res) => {
  try {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};

module.exports = { register, login, logout };

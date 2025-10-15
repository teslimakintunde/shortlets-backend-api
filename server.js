const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const allowedOrigine = require("./config/allowedOringin");
const corsOptions = require("./config/corsOptions");
const prisma = require("./lib/prisma");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigine,
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  try {
    // getting token from handshake auth first
    let token = socket.handshake.auth.token;

    // If not found in auth, try to get from cookies
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(";");
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === "token") {
          token = decodeURIComponent(value);
          break;
        }
      }
    }

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token - using the same key as auth controller
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = decoded.id;

    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);

  // Joining user to their own room for private messages
  socket.join(`user_${socket.userId}`);

  // Handling sending messages
  socket.on("sendMessage", (data) => {
    const { chatId, message, receiverId, senderId } = data;

    // Emitting to the receiver
    socket.to(`user_${receiverId}`).emit("newMessage", {
      chatId,
      message,
      senderId: socket.userId,
    });

    //  emitting to sender for real-time update
    socket.emit("newMessage", {
      chatId,
      message,
      senderId: senderId,
    });
  });

  // Handleing disconnect
  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.userId} disconnected:`, reason);
  });
});

// Middleware to attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/test", require("./routes/testRoute"));
app.use("/api/posts", require("./routes/postRoute"));
app.use("/api/users", require("./routes/userRoute"));

app.use("/api/chats", require("./routes/chatRoute"));
app.use("/api/messages", require("./routes/messageRoute"));

app.use("/api/payments", require("./routes/paymentRoute"));

app.use("/api/bookings", require("./routes/bookingRoute"));
app.use("/api/sales", require("./routes/saleRoute"));

app.use("/api/reviews", require("./routes/reviewRoute"));

app.get("/api/debug/db-check", async (req, res) => {
  try {
    const postCount = await prisma.post.count();
    const userCount = await prisma.user.count();
    const recentPosts = await prisma.post.findMany({
      take: 5,
      select: { id: true, title: true, isActive: true }, // ✅ Fixed this line
    });

    res.json({
      success: true,
      postCount,
      userCount,
      recentPosts,
      database: process.env.DATABASE_URL ? "Connected" : "No URL",
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
    });
  }
});
app.get("/api/test-posts", async (req, res) => {
  try {
    const allPosts = await prisma.post.findMany({
      include: {
        owner: { select: { username: true } },
        postDetail: true,
      },
    });

    res.json({
      success: true,
      count: allPosts.length,
      posts: allPosts,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const addMessage = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.chatId);
  const { content } = req.body;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!chatId || isNaN(chatId)) {
    return res.status(400).json({ success: false, message: "Invalid chat ID" });
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Message content is required" });
  }

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        OR: [{ buyerId: tokenUserId }, { sellerId: tokenUserId }],
      },
      select: { id: true, buyerId: true, sellerId: true, lastReadBy: true },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or you are not authorized",
      });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: tokenUserId,
        content: content.trim(),
        isRead: false,
        seenBy: { [tokenUserId]: new Date().toISOString() },
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Update chat's updatedAt and lastReadBy
    const currentLastReadBy = chat.lastReadBy || {};
    const updatedLastReadBy = {
      ...currentLastReadBy,
      [tokenUserId]: new Date().toISOString(),
    };

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        lastReadBy: updatedLastReadBy,
      },
    });

    // Emit Socket.IO event with full message object
    const receiverId =
      chat.buyerId === tokenUserId ? chat.sellerId : chat.buyerId;

    // Check if req.io exists before using it
    if (req.io) {
      // Use the correct room name format that matches your Socket.io setup
      req.io.to(`user_${receiverId}`).emit("newMessage", {
        chatId,
        message: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          isRead: message.isRead,
          seenBy: message.seenBy,
          sender: message.sender,
        },
        senderId: tokenUserId,
        senderName: message.sender.username,
      });

      // Also emit to the sender for consistency
      req.io.to(`user_${tokenUserId}`).emit("newMessage", {
        chatId,
        message: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          isRead: message.isRead,
          seenBy: message.seenBy,
          sender: message.sender,
        },
        senderId: tokenUserId,
        senderName: message.sender.username,
      });
    }

    res.status(201).json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error("Error adding message:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add message",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = { addMessage };

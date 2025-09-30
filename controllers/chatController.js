const prisma = require("../lib/prisma");

const getAllChats = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ buyerId: tokenUserId }, { sellerId: tokenUserId }],
      },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const transformedChats = chats.map((chat) => ({
      ...chat,
      receiver: chat.buyerId === tokenUserId ? chat.seller : chat.buyer,
    }));

    res.status(200).json({ success: true, data: transformedChats });
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get chats",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getSingleChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.id);
  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!chatId || isNaN(chatId)) {
    return res.status(400).json({ success: false, message: "Invalid chat ID" });
  }
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        OR: [{ buyerId: tokenUserId }, { sellerId: tokenUserId }],
      },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
            seenBy: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or you are not authorized",
      });
    }

    const currentLastReadBy = chat.lastReadBy || {};
    const updatedLastReadBy = {
      ...currentLastReadBy,
      [tokenUserId]: new Date().toISOString(),
    };

    if (
      JSON.stringify(currentLastReadBy) !== JSON.stringify(updatedLastReadBy)
    ) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { lastReadBy: updatedLastReadBy },
      });
    }

    const transformedChat = {
      ...chat,
      receiver: chat.buyerId === tokenUserId ? chat.seller : chat.buyer,
    };

    res.status(200).json({ success: true, data: transformedChat });
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get chat",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const addChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const { postId, receiverId } = req.body;
  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!postId || !receiverId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: postId and receiverId",
    });
  }
  const postIdInt = parseInt(postId);
  const receiverIdInt = parseInt(receiverId);
  if (isNaN(postIdInt) || isNaN(receiverIdInt)) {
    return res.status(400).json({
      success: false,
      message: "Invalid postId or receiverId",
    });
  }
  try {
    const post = await prisma.post.findUnique({
      where: { id: postIdInt },
      select: { id: true, ownerId: true },
    });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    const receiver = await prisma.user.findUnique({
      where: { id: receiverIdInt },
      select: { id: true },
    });
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Receiver not found" });
    }
    if (receiverIdInt === tokenUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a chat with yourself",
      });
    }
    const isBuyer = post.ownerId !== tokenUserId;
    const buyerId = isBuyer ? tokenUserId : receiverIdInt;
    const sellerId = isBuyer ? post.ownerId : receiverIdInt;
    if (isBuyer && receiverIdInt !== post.ownerId) {
      return res.status(400).json({
        success: false,
        message: "Receiver must be the post owner",
      });
    }
    const existingChat = await prisma.chat.findUnique({
      where: {
        postId_buyerId_sellerId: {
          postId: postIdInt,
          buyerId,
          sellerId,
        },
      },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
      },
    });
    if (existingChat) {
      return res.status(200).json({
        success: true,
        data: {
          ...existingChat,
          receiver:
            existingChat.buyerId === tokenUserId
              ? existingChat.seller
              : existingChat.buyer,
        },
        message: "Chat already exists",
      });
    }
    const newChat = await prisma.chat.create({
      data: {
        postId: postIdInt,
        buyerId,
        sellerId,
        lastReadBy: {},
      },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
        messages: {
          // Include messages if needed
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
            seenBy: true,
          },
        },
      },
    });

    // Emit socket event for new chat to both users
    if (req.io) {
      const transformedChat = {
        ...newChat,
        receiver:
          newChat.buyerId === tokenUserId ? newChat.seller : newChat.buyer,
        messages: newChat.messages || [],
      };

      // Emit to both users involved in the chat
      req.io.to(`user_${buyerId}`).emit("newChat", { chat: transformedChat });
      req.io.to(`user_${sellerId}`).emit("newChat", { chat: transformedChat });
    }

    res.status(201).json({
      success: true,
      data: {
        ...newChat,
        receiver:
          newChat.buyerId === tokenUserId ? newChat.seller : newChat.buyer,
      },
      message: "Chat created successfully",
    });
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create chat",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const readChat = async (req, res) => {
  const tokenUserId = parseInt(req.userId);
  const chatId = parseInt(req.params.id);
  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!chatId || isNaN(chatId)) {
    return res.status(400).json({ success: false, message: "Invalid chat ID" });
  }
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        OR: [{ buyerId: tokenUserId }, { sellerId: tokenUserId }],
      },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
        messages: {
          // Include messages
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
            seenBy: true,
          },
        },
      },
    });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or you are not authorized",
      });
    }
    const currentLastReadBy = chat.lastReadBy || {};
    const updatedLastReadBy = {
      ...currentLastReadBy,
      [tokenUserId]: new Date().toISOString(),
    };
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { lastReadBy: updatedLastReadBy },
      include: {
        post: { select: { id: true, title: true, images: true } },
        buyer: { select: { id: true, username: true, avatar: true } },
        seller: { select: { id: true, username: true, avatar: true } },
        messages: {
          // Include messages
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
            seenBy: true,
          },
        },
      },
    });
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: tokenUserId },
        isRead: false,
      },
      data: {
        isRead: true,
        seenBy: updatedLastReadBy,
      },
    });
    res.status(200).json({
      success: true,
      data: {
        ...updatedChat,
        receiver:
          updatedChat.buyerId === tokenUserId
            ? updatedChat.seller
            : updatedChat.buyer,
      },
      message: "Chat marked as read",
    });
  } catch (err) {
    console.error("Error marking chat as read:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark chat as read",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = { getAllChats, getSingleChat, addChat, readChat };

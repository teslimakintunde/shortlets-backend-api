const prisma = require("../lib/prisma");

const getUserNotifications = async (req, res) => {
  const tokenUserId = parseInt(req.userId);

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: tokenUserId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

const markAsRead = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = parseInt(req.userId);

  try {
    const notification = await prisma.notification.update({
      where: { id, userId: tokenUserId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
};

const markAllAsRead = async (req, res) => {
  const tokenUserId = parseInt(req.userId);

  try {
    await prisma.notification.updateMany({
      where: { userId: tokenUserId, isRead: false },
      data: { isRead: true },
    });

    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
    });
  }
};

const deleteNotification = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = parseInt(req.userId);

  try {
    await prisma.notification.delete({
      where: { id, userId: tokenUserId },
    });

    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete notification" });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

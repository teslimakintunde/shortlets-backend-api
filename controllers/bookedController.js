const prisma = require("../lib/prisma");

const getAllBookings = async (req, res) => {
  try {
    const { status, userId, postId, page = 1, limit = 20 } = req.query;

    const whereClause = { transactionType: "rental" };
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = parseInt(userId);
    if (postId) whereClause.postId = parseInt(postId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, username: true, email: true } },
          post: { select: { id: true, title: true, price: true, type: true } },
          card: { select: { id: true, lastFour: true, brand: true } },
          booking: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              startDate: true,
              endDate: true,
              guests: true,
            },
          },
          reviews: {
            include: {
              reviewer: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

const getSingleBooking = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const booking = await prisma.payment.findUnique({
      where: { id, transactionType: "rental" },
      include: {
        user: { select: { id: true, username: true, email: true } },
        post: {
          select: {
            id: true,
            title: true,
            price: true,
            type: true,
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        card: { select: { id: true, lastFour: true, brand: true } },
        booking: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            startDate: true,
            endDate: true,
            guests: true,
            specialRequests: true,
          },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking" });
  }
};

const getUserBookings = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const whereClause = { userId, transactionType: "rental" };
    if (status) whereClause.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              price: true,
              type: true,
              images: true,
              owner: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          reviews: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user bookings" });
  }
};

const updateBookingStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (
    !["pending", "completed", "failed", "refunded", "cancelled"].includes(
      status
    )
  ) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const booking = await prisma.payment.findUnique({
      where: { id, transactionType: "rental" },
    });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const updatedBooking = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, username: true, email: true } },
        post: { select: { id: true, title: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedBooking,
      message: "Booking status updated successfully",
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update booking" });
  }
};

module.exports = {
  getAllBookings,
  getSingleBooking,
  getUserBookings,
  updateBookingStatus,
};

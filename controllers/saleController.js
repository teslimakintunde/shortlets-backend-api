const prisma = require("../lib/prisma");

const getAllSales = async (req, res) => {
  try {
    const { status, userId, postId, page = 1, limit = 20 } = req.query;

    const whereClause = { transactionType: "sale" };
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = parseInt(userId);
    if (postId) whereClause.postId = parseInt(postId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
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
      data: sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sales" });
  }
};

const getSingleSale = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const sale = await prisma.payment.findUnique({
      where: { id, transactionType: "sale" },
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

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sale" });
  }
};

const getUserSales = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const whereClause = { userId, transactionType: "sale" };
    if (status) whereClause.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
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
      data: sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user sales:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user sales" });
  }
};

const updateSaleStatus = async (req, res) => {
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
    const sale = await prisma.payment.findUnique({
      where: { id, transactionType: "sale" },
    });
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    const updatedSale = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, username: true, email: true } },
        post: { select: { id: true, title: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedSale,
      message: "Sale status updated successfully",
    });
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ success: false, message: "Failed to update sale" });
  }
};

module.exports = {
  getAllSales,
  getSingleSale,
  getUserSales,
  updateSaleStatus,
};

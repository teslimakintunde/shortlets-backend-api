const prisma = require("../lib/prisma");

const reviewValidation = []; // Empty validation array

const sanitizeReview = (reviewData) => {
  return {
    ...reviewData,
    title: reviewData.title ? reviewData.title.trim() : null,
    comment: reviewData.comment.trim(),
    moderationReason: reviewData.moderationReason
      ? reviewData.moderationReason.trim()
      : null,
  };
};

const getAllReviews = async (req, res) => {
  try {
    const {
      status,
      rating,
      postId,
      reviewerId,
      revieweeId,
      isVerified,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (rating) whereClause.rating = parseInt(rating);
    if (postId) whereClause.postId = parseInt(postId);
    if (reviewerId) whereClause.reviewerId = parseInt(reviewerId);
    if (revieweeId) whereClause.revieweeId = parseInt(revieweeId);
    if (isVerified !== undefined)
      whereClause.isVerified = isVerified === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: { select: { id: true, username: true, avatar: true } },
          reviewee: { select: { id: true, username: true, avatar: true } },
          post: { select: { id: true, title: true } },
          moderatedBy: { select: { id: true, username: true } },
          payment: { select: { id: true, amount: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};

const getSingleReview = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, username: true, avatar: true } },
        reviewee: { select: { id: true, username: true, avatar: true } },
        post: { select: { id: true, title: true } },
        moderatedBy: { select: { id: true, username: true } },
        payment: { select: { id: true, amount: true, status: true } },
        booking: { select: { id: true, totalAmount: true, status: true } },
      },
    });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ success: false, message: "Failed to fetch review" });
  }
};

const createReview = async (req, res) => {
  const tokenUserId = req.userId ? parseInt(req.userId) : null;
  const reviewData = sanitizeReview(req.body);

  console.log("Creating review with data:", {
    tokenUserId,
    reviewData,
    body: req.body,
  });

  if (!tokenUserId) {
    console.log("No user ID found in token");
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    // Check if user already reviewed this post
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: tokenUserId,
        postId: parseInt(reviewData.postId),
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this post",
      });
    }

    // Check if reviewee exists
    const reviewee = await prisma.user.findUnique({
      where: { id: parseInt(reviewData.revieweeId) },
      select: { id: true },
    });

    if (!reviewee) {
      return res.status(404).json({
        success: false,
        message: "Reviewee not found",
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(reviewData.postId) },
      select: { id: true, ownerId: true, type: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.ownerId !== parseInt(reviewData.revieweeId)) {
      return res.status(400).json({
        success: false,
        message: "Reviewee must be the post owner",
      });
    }

    let isVerified = false;

    // For rentals, check if booking exists and is completed
    if (post.type === "rent" && reviewData.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: parseInt(reviewData.bookingId),
          userId: tokenUserId,
          postId: parseInt(reviewData.postId),
          status: "completed",
          endDate: { lte: new Date() },
        },
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking for review or stay not completed yet",
        });
      }
      isVerified = true;
    }

    // For purchases, check if payment exists and is completed
    if (post.type === "buy" && reviewData.paymentId) {
      const payment = await prisma.payment.findFirst({
        where: {
          id: parseInt(reviewData.paymentId),
          userId: tokenUserId,
          postId: parseInt(reviewData.postId),
          status: "completed",
        },
      });

      if (!payment) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment transaction for review",
        });
      }
      isVerified = true;
    }

    console.log("All validations passed, creating review...");

    // CHANGED: All reviews are automatically approved and show immediately
    const review = await prisma.review.create({
      data: {
        rating: parseInt(reviewData.rating),
        title: reviewData.title,
        comment: reviewData.comment,
        reviewerId: tokenUserId,
        revieweeId: parseInt(reviewData.revieweeId),
        postId: parseInt(reviewData.postId),
        paymentId: reviewData.paymentId ? parseInt(reviewData.paymentId) : null,
        bookingId: reviewData.bookingId ? parseInt(reviewData.bookingId) : null,
        status: "approved", // CHANGED: Always set to approved
        isVerified,
        approvedAt: new Date(), // CHANGED: Set approval date immediately
      },
      include: {
        reviewer: { select: { id: true, username: true, avatar: true } },
        reviewee: { select: { id: true, username: true, avatar: true } },
        post: { select: { id: true, title: true } },
      },
    });

    console.log("Review created successfully:", review);

    // Update post average rating - include all approved reviews
    await updatePostRating(parseInt(reviewData.postId));

    res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted successfully now",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to create review" });
  }
};

async function updatePostRating(postId) {
  const reviews = await prisma.review.findMany({
    where: {
      postId,
      status: "approved", // Only count approved reviews
    },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await prisma.post.update({
      where: { id: postId },
      data: { rating: averageRating },
    });
  }
}

const updateReviewStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, moderationReason } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status,
        moderationReason: moderationReason ? moderationReason.trim() : null,
        moderatedById: status !== "pending" ? parseInt(req.userId) : null,
        approvedAt: status === "approved" ? new Date() : null,
      },
      include: {
        reviewer: { select: { id: true, username: true, avatar: true } },
        reviewee: { select: { id: true, username: true, avatar: true } },
        post: { select: { id: true, title: true } },
        moderatedBy: { select: { id: true, username: true } },
      },
    });

    // Update post rating if review status changes
    await updatePostRating(review.postId);

    res.status(200).json({
      success: true,
      data: updatedReview,
      message: "Review status updated successfully",
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update review" });
  }
};

const deleteReview = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId ? parseInt(req.userId) : null;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    if (review.reviewerId !== tokenUserId && !req.adminId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    await prisma.review.delete({ where: { id } });

    // Update post rating after deletion
    await updatePostRating(review.postId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete review" });
  }
};

const getUserReviews = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { type = "received", page = 1, limit = 20 } = req.query;

  try {
    // CHANGED: For received reviews, only show approved ones. For sent reviews, show all.
    const whereClause =
      type === "received"
        ? { revieweeId: userId, status: "approved" }
        : { reviewerId: userId };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: { select: { id: true, username: true, avatar: true } },
          reviewee: { select: { id: true, username: true, avatar: true } },
          post: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    let averageRating = null;
    if (type === "received") {
      const ratingAggregate = await prisma.review.aggregate({
        where: { revieweeId: userId, status: "approved" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      averageRating = {
        average: ratingAggregate._avg.rating,
        count: ratingAggregate._count.rating,
      };
    }

    res.status(200).json({
      success: true,
      data: reviews,
      averageRating,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user reviews" });
  }
};

module.exports = {
  reviewValidation,
  getAllReviews,
  getSingleReview,
  createReview,
  updateReviewStatus,
  deleteReview,
  getUserReviews,
};

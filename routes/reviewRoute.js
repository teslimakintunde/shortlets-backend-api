const express = require("express");
const router = express.Router();

const { handleValidationErrors } = require("../middleware/validation");
const {
  getAllReviews,
  getUserReviews,
  getSingleReview,
  reviewValidation,
  createReview,
  deleteReview,
  updateReviewStatus,
} = require("../controllers/reviewController");
const {
  shouldBeLogin,
  shouldBeAdmin,
} = require("../controllers/testController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, getAllReviews);
router.get("/user/:userId", verifyToken, getUserReviews);
router.get("/:id", verifyToken, getSingleReview);

// Protected routes with validation
router.post(
  "/",
  verifyToken,

  createReview
);

router.delete("/:id", verifyToken, shouldBeAdmin, deleteReview);

router.put("/:id/status", verifyToken, shouldBeAdmin, updateReviewStatus);

module.exports = router;

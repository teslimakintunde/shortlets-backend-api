const express = require("express");
const {
  shouldBeAdmin,
  shouldBeLogin,
} = require("../controllers/testController");

const verifyToken = require("../middleware/verifyToken");
const {
  getAllBookings,
  updateBookingStatus,
  getSingleBooking,
  getUserBookings,
} = require("../controllers/bookedController");
const router = express.Router();

// Admin routes
router.get("/", verifyToken, shouldBeAdmin, getAllBookings);
router.get("/:id", verifyToken, getSingleBooking);
router.put("/:id/status", verifyToken, shouldBeAdmin, updateBookingStatus);

// User routes
router.get("/user/:userId", verifyToken, getUserBookings);

module.exports = router;

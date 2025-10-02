const express = require("express");
const {
  getAllPayments,
  getSinglePayment,
  confirmPayment,
  handleWebhook,
  getUserCards,
  deletePaymentCard,
  addPaymentCard,
  createPaymentIntent,
  cleanupStalePayments,
} = require("../controllers/paymentController");
const verifyToken = require("../middleware/verifyToken");
const { shouldBeAdmin } = require("../controllers/testController");
const router = express.Router();

router.get("/", verifyToken, shouldBeAdmin, getAllPayments);

// User routes
router.get("/card", verifyToken, getUserCards);
router.post("/card", verifyToken, addPaymentCard);
router.delete("/card/:id", verifyToken, deletePaymentCard);
router.post("/create-intent", verifyToken, createPaymentIntent);
router.post("/confirm", verifyToken, confirmPayment);
router.post("/cleanup", verifyToken, shouldBeAdmin, cleanupStalePayments);
module.exports = router;

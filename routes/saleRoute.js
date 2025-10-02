const express = require("express");
const {
  shouldBeAdmin,
  shouldBeLogin,
} = require("../controllers/testController");
const {
  getAllSales,
  getSingleSale,
  updateSaleStatus,
  getUserSales,
} = require("../controllers/saleController");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// Admin routes
router.get("/", verifyToken, shouldBeAdmin, getAllSales);
router.get("/:id", verifyToken, getSingleSale);
router.put("/:id/status", verifyToken, shouldBeAdmin, updateSaleStatus);

// User routes
router.get("/user/:userId", verifyToken, getUserSales);

module.exports = router;

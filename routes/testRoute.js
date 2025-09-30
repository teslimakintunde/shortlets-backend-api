const express = require("express");
const {
  shouldBeLogin,
  shouldBeAdmin,
} = require("../controllers/testController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/should-be-logged-in", verifyToken, shouldBeLogin);
router.get("/should-be-admin", verifyToken, shouldBeAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are an admin",
    adminId: req.userId,
  });
});

module.exports = router;

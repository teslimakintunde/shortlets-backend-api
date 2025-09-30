const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.get("/", verifyToken, chatController.getAllChats);
router.get("/:id", verifyToken, chatController.getSingleChat);
router.post("/", verifyToken, chatController.addChat);
router.put("/:id/read", verifyToken, chatController.readChat);

module.exports = router;

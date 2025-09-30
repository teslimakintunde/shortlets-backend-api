const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const { addMessage } = require("../controllers/messageController");
const router = express.Router();

router.post("/:chatId", verifyToken, addMessage);

module.exports = router;

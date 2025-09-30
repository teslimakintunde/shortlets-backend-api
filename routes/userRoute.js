const express = require("express");
const {
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  savePost,
  profilePosts,
  adminDeleteUser,
} = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");
const { shouldBeAdmin } = require("../controllers/testController");

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", verifyToken, getSingleUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
// Admin can delete any user
router.delete("/admin/:id", verifyToken, shouldBeAdmin, adminDeleteUser);
router.post("/save", verifyToken, savePost);
router.get("/profile/posts", verifyToken, profilePosts);

module.exports = router;

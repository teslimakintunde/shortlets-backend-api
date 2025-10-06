const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  addPost,
  getAllPosts,
  getSinglePost,
  deletePost,
  updatePost,
  adminDeletePost,
  getFeaturedPosts,
} = require("../controllers/postController");
const { shouldBeAdmin } = require("../controllers/testController");

const router = express.Router();

router.get("/", getAllPosts);
router.get("/featured", getFeaturedPosts);
router.get("/:id", getSinglePost);
router.post("/", verifyToken, addPost);

router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
router.delete("/admin/:id", verifyToken, shouldBeAdmin, adminDeletePost);

module.exports = router;

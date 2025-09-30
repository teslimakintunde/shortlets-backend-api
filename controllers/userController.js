const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");

const getUsers = async (req, res) => {
  try {
    const allusers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        userProfile: {
          select: {
            phone: true,
            bio: true,
            country: true,
            state: true,
            city: true,
          },
        },
      },
    });
    res.status(200).json(allusers);
  } catch (err) {
    res.status(500).json({ success: false, message: "failed to fetch users" });
  }
};

const getSingleUser = async (req, res) => {
  const id = parseInt(req.params.id);

  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "user id not provided" });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        userProfile: {
          select: {
            phone: true,
            bio: true,
            country: true,
            state: true,
            city: true,
          },
        },
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { password, avatar, username, email, ...profileData } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
      },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (username && username !== existingUser.username) {
      const usernameExist = await prisma.user.findFirst({
        where: { username },
      });
      if (usernameExist) {
        return res
          .status(400)
          .json({ success: false, message: "username already exist" });
      }
    }

    if (email && email !== existingUser.email) {
      const emailExist = await prisma.user.findFirst({
        where: { email },
      });
      if (emailExist) {
        return res
          .status(400)
          .json({ success: false, message: "email already exist" });
      }
    }

    let updatedPassword = null;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.$transaction(async (prisma) => {
      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(username && { username }),
          ...(updatedPassword && { password: updatedPassword }),
          ...(avatar && { avatar }),
        },
      });

      // Update or create user profile
      if (profileData) {
        await prisma.userProfile.upsert({
          where: { userId: id },
          update: {
            phone:
              profileData.phone !== undefined
                ? profileData.phone
                : existingUser.userProfile?.phone,
            bio:
              profileData.bio !== undefined
                ? profileData.bio
                : existingUser.userProfile?.bio,
            country:
              profileData.country !== undefined
                ? profileData.country
                : existingUser.userProfile?.country,
            state:
              profileData.state !== undefined
                ? profileData.state
                : existingUser.userProfile?.state,
            city:
              profileData.city !== undefined
                ? profileData.city
                : existingUser.userProfile?.city,
          },
          create: {
            userId: id,
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            country: profileData.country || "",
            state: profileData.state || "",
            city: profileData.city || "",
          },
        });
      }

      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          createdAt: true,
          userProfile: true,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Use transaction to delete all related data
    await prisma.$transaction([
      // Delete user profile
      prisma.userProfile.deleteMany({
        where: { userId: id },
      }),
      // Delete saved posts
      prisma.savedPost.deleteMany({
        where: { userId: id },
      }),
      // Delete user's posts and their related data
      prisma.post.deleteMany({
        where: { ownerId: id },
      }),
      // Delete user
      prisma.user.delete({
        where: { id },
      }),
    ]);

    res
      .status(200)
      .json({ success: true, message: "User successfully deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Failed to delete user!" });
  }
};

const adminDeleteUser = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await prisma.$transaction([
      prisma.userProfile.deleteMany({
        where: { userId: id },
      }),
      prisma.savedPost.deleteMany({
        where: { userId: id },
      }),
      prisma.post.deleteMany({
        where: { ownerId: id },
      }),
      prisma.user.delete({
        where: { id },
      }),
    ]);

    res
      .status(200)
      .json({ success: true, message: "User successfully deleted by admin" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ success: false, message: "Failed to delete user!" });
  }
};

const savePost = async (req, res) => {
  const postId = parseInt(req.body.postId);
  const tokenUserId = parseInt(req.userId);

  // Validate input
  if (!postId || isNaN(postId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid post ID",
    });
  }

  try {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if the post is already saved
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId: postId,
        },
      },
    });

    if (savedPost) {
      // Remove from saved list
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({
        success: true,
        message: "Post removed from saved list",
        isSaved: false,
      });
    } else {
      // Add to saved list
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId: postId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Post saved successfully",
        isSaved: true,
      });
    }
  } catch (err) {
    console.error("Error in savePost:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const profilePosts = async (req, res) => {
  try {
    const tokenUserId = parseInt(req.userId);

    if (!tokenUserId || isNaN(tokenUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user authentication",
      });
    }

    // Get user's own posts
    const userPosts = await prisma.post.findMany({
      where: {
        ownerId: tokenUserId, // Use ownerId instead of userId
      },
      include: {
        owner: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform images from JSON
    const transformedUserPosts = userPosts.map((post) => ({
      ...post,
      images: Array.isArray(post.images) ? post.images : [],
    }));

    // Get user's saved posts
    const saved = await prisma.savedPost.findMany({
      where: {
        userId: tokenUserId,
      },
      include: {
        post: {
          include: {
            owner: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform saved posts
    const savedPosts = saved.map((item) => ({
      ...item.post,
      images: Array.isArray(item.post.images) ? item.post.images : [],
      savedAt: item.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        userPosts: transformedUserPosts,
        savedPosts: savedPosts,
      },
    });
  } catch (err) {
    console.error("Error in profilePosts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get profile posts",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  savePost,
  profilePosts,
  adminDeleteUser,
};

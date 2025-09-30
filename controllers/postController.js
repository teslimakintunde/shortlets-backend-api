const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");

const getSinglePost = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid post ID",
    });
  }
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        owner: {
          select: {
            username: true,
            avatar: true,
          },
        },
        bookings: {
          // Include booking history for both rent and buy properties
          where: {
            status: {
              in: ["confirmed", "completed", "active", "cancelled", "rejected"],
            },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            status: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Calculate next available date for rental properties
    let nextAvailableDate = null;
    if (post.type === "rent") {
      // Get all confirmed, active, or upcoming bookings
      const activeBookings = await prisma.booking.findMany({
        where: {
          postId: id,
          status: { in: ["confirmed", "active"] },
          endDate: { gte: new Date() },
        },
        orderBy: { endDate: "asc" },
        take: 1,
      });

      if (activeBookings.length > 0) {
        nextAvailableDate = activeBookings[0].endDate;
      } else if (post.availableFrom) {
        nextAvailableDate = post.availableFrom;
      } else {
        nextAvailableDate = new Date(); // Available now
      }
    }

    const images = Array.isArray(post.images) ? post.images : [];
    const transformedPost = {
      ...post,
      images: images,
      nextAvailableDate: nextAvailableDate,
    };

    const token = req.cookies?.token;
    let isSaved = false;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const saved = await prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              postId: id,
              userId: payload.id,
            },
          },
        });
        isSaved = !!saved;
      } catch (err) {
        console.error("Token verification error:", err);
      }
    }

    res.status(200).json({
      success: true,
      data: { ...transformedPost, isSaved },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
const updatePost = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId ? parseInt(req.userId) : null;
  const { postData, postDetail } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid post ID",
    });
  }
  if (!tokenUserId || isNaN(tokenUserId)) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { postDetail: true },
    });
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (existingPost.ownerId !== tokenUserId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    const updatedPost = await prisma.$transaction(async (prisma) => {
      const post = await prisma.post.update({
        where: { id },
        data: {
          title: postData?.title || existingPost.title,
          price: postData?.price
            ? parseInt(postData.price)
            : existingPost.price,
          address: postData?.address || existingPost.address,
          city: postData?.city || existingPost.city,
          bedroom: postData?.bedroom
            ? parseInt(postData.bedroom)
            : existingPost.bedroom,
          bathroom: postData?.bathroom
            ? parseInt(postData.bathroom)
            : existingPost.bathroom,
          type: postData?.type || existingPost.type,
          property: postData?.property || existingPost.property,
          latitude: postData?.latitude || existingPost.latitude,
          longitude: postData?.longitude || existingPost.longitude,
          images: postData?.images || existingPost.images,
          state: postData?.state || existingPost.state,
          country: postData?.country || existingPost.country,
          zipCode: postData?.zipCode || existingPost.zipCode,
          ownershipType: postData?.ownershipType || existingPost.ownershipType,
          titleDeedStatus:
            postData?.titleDeedStatus || existingPost.titleDeedStatus,
          hoaFees: postData?.hoaFees
            ? parseFloat(postData.hoaFees)
            : existingPost.hoaFees,
          propertyTaxes: postData?.propertyTaxes
            ? parseFloat(postData.propertyTaxes)
            : existingPost.propertyTaxes,
          financingOptions:
            postData?.financingOptions || existingPost.financingOptions,
          lotSize: postData?.lotSize
            ? parseInt(postData.lotSize)
            : existingPost.lotSize,
          zoning: postData?.zoning || existingPost.zoning,
        },
      });

      if (postDetail) {
        await prisma.postDetail.upsert({
          where: { postId: id },
          update: {
            description:
              postDetail.description || existingPost.postDetail?.description,
            utilities:
              postDetail.utilities || existingPost.postDetail?.utilities,
            pet: postDetail.pet || existingPost.postDetail?.pet,
            income: postDetail.income || existingPost.postDetail?.income,
            size: postDetail.size
              ? parseInt(postDetail.size)
              : existingPost.postDetail?.size,
            school: postDetail.school
              ? parseInt(postDetail.school)
              : existingPost.postDetail?.school,
            bus: postDetail.bus
              ? parseInt(postDetail.bus)
              : existingPost.postDetail?.bus,
            restaurant: postDetail.restaurant
              ? parseInt(postDetail.restaurant)
              : existingPost.postDetail?.restaurant,
            wifi:
              postDetail.wifi !== undefined
                ? postDetail.wifi
                : existingPost.postDetail?.wifi,
            airConditioning:
              postDetail.airConditioning !== undefined
                ? postDetail.airConditioning
                : existingPost.postDetail?.airConditioning,
            parking:
              postDetail.parking !== undefined
                ? postDetail.parking
                : existingPost.postDetail?.parking,
            securityPersonnel:
              postDetail.securityPersonnel !== undefined
                ? postDetail.securityPersonnel
                : existingPost.postDetail?.securityPersonnel,
            furnished:
              postDetail.furnished !== undefined
                ? postDetail.furnished
                : existingPost.postDetail?.furnished,
            renovationHistory:
              postDetail.renovationHistory ||
              existingPost.postDetail?.renovationHistory,
            includedAppliances:
              postDetail.includedAppliances ||
              existingPost.postDetail?.includedAppliances,
            hoaAmenities:
              postDetail.hoaAmenities || existingPost.postDetail?.hoaAmenities,
            energyEfficiency:
              postDetail.energyEfficiency ||
              existingPost.postDetail?.energyEfficiency,
            homeWarranty:
              postDetail.homeWarranty !== undefined
                ? postDetail.homeWarranty
                : existingPost.postDetail?.homeWarranty,
            airport: postDetail.airport
              ? parseInt(postDetail.airport)
              : existingPost.postDetail?.airport,
            supermarket: postDetail.supermarket
              ? parseInt(postDetail.supermarket)
              : existingPost.postDetail?.supermarket,
            shoppingMall: postDetail.shoppingMall
              ? parseInt(postDetail.shoppingMall)
              : existingPost.postDetail?.shoppingMall,
            nearestClub: postDetail.nearestClub
              ? parseInt(postDetail.nearestClub)
              : existingPost.postDetail?.nearestClub,
            hospital: postDetail.hospital
              ? parseInt(postDetail.hospital)
              : existingPost.postDetail?.hospital,
            beach: postDetail.beach
              ? parseInt(postDetail.beach)
              : existingPost.postDetail?.beach,
            publicTransport: postDetail.publicTransport
              ? parseInt(postDetail.publicTransport)
              : existingPost.postDetail?.publicTransport,
            restaurants: postDetail.restaurants
              ? parseInt(postDetail.restaurants)
              : existingPost.postDetail?.restaurants,
          },
          create: {
            postId: id,
            description: postDetail.description || "",
            utilities: postDetail.utilities || "owner",
            pet: postDetail.pet || "allowed",
            income: postDetail.income || "",
            size: postDetail.size ? parseInt(postDetail.size) : 0,
            school: postDetail.school ? parseInt(postDetail.school) : 0,
            bus: postDetail.bus ? parseInt(postDetail.bus) : 0,
            restaurant: postDetail.restaurant
              ? parseInt(postDetail.restaurant)
              : 0,
            wifi: postDetail.wifi || false,
            airConditioning: postDetail.airConditioning || false,
            parking: postDetail.parking || false,
            securityPersonnel: postDetail.securityPersonnel || false,
            furnished: postDetail.furnished || false,
            renovationHistory: postDetail.renovationHistory || null,
            includedAppliances: postDetail.includedAppliances || null,
            hoaAmenities: postDetail.hoaAmenities || null,
            energyEfficiency: postDetail.energyEfficiency || null,
            homeWarranty: postDetail.homeWarranty || false,
            airport: postDetail.airport ? parseInt(postDetail.airport) : null,
            supermarket: postDetail.supermarket
              ? parseInt(postDetail.supermarket)
              : null,
            shoppingMall: postDetail.shoppingMall
              ? parseInt(postDetail.shoppingMall)
              : null,
            nearestClub: postDetail.nearestClub
              ? parseInt(postDetail.nearestClub)
              : null,
            hospital: postDetail.hospital
              ? parseInt(postDetail.hospital)
              : null,
            beach: postDetail.beach ? parseInt(postDetail.beach) : null,
            publicTransport: postDetail.publicTransport
              ? parseInt(postDetail.publicTransport)
              : null,
            restaurants: postDetail.restaurants
              ? parseInt(postDetail.restaurants)
              : null,
          },
        });
      }

      return await prisma.post.findUnique({
        where: { id },
        include: {
          postDetail: true,
          owner: {
            select: {
              username: true,
              avatar: true,
            },
          },
          bookings: {
            where: { status: { in: ["confirmed", "completed"] } },
            select: {
              startDate: true,
              endDate: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      data: {
        ...updatedPost,
        images: Array.isArray(updatedPost.images) ? updatedPost.images : [],
      },
      message: "Post updated successfully",
    });
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const deletePost = async (req, res) => {
  const id = parseInt(req.params.id);
  const tokenUserId = req.userId ? parseInt(req.userId) : null;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid post ID",
    });
  }
  if (!tokenUserId || isNaN(tokenUserId)) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (existingPost.ownerId !== tokenUserId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await prisma.$transaction([
      prisma.savedPost.deleteMany({ where: { postId: id } }),
      prisma.postImage.deleteMany({ where: { postId: id } }),
      prisma.postDetail.deleteMany({ where: { postId: id } }),
      prisma.chat.deleteMany({ where: { postId: id } }),
      prisma.review.deleteMany({ where: { postId: id } }),
      prisma.booking.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getAllPosts = async (req, res) => {
  const query = req.query;
  try {
    const whereClause = { isActive: true };
    if (query.type && query.type !== "undefined") whereClause.type = query.type;
    if (query.property && query.property !== "undefined")
      whereClause.property = query.property;
    if (query.country && query.country !== "undefined")
      whereClause.country = { contains: query.country };
    if (query.state && query.state !== "undefined")
      whereClause.state = { contains: query.state };
    if (query.city && query.city !== "undefined")
      whereClause.city = { contains: query.city };
    if (query.bedroom && query.bedroom !== "undefined") {
      const bedroomValue = parseInt(query.bedroom);
      if (!isNaN(bedroomValue)) whereClause.bedroom = { gte: bedroomValue };
    }
    if (query.priceRange && query.priceRange !== "undefined") {
      const [minPrice, maxPrice] = query.priceRange.split("-").map(Number);
      whereClause.price = {};
      if (!isNaN(minPrice)) whereClause.price.gte = minPrice;
      if (!isNaN(maxPrice)) whereClause.price.lte = maxPrice;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 12;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              username: true,
              avatar: true,
            },
          },
          postDetail: {
            select: {
              wifi: true,
              airConditioning: true,
              parking: true,
              furnished: true,
              size: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const transformedPosts = posts.map((post) => ({
      ...post,
      images: Array.isArray(post.images) ? post.images : [],
    }));

    res.status(200).json({
      success: true,
      data: transformedPosts,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      filters: query,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get posts",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const addPost = async (req, res) => {
  const { postData, postDetail } = req.body;
  const tokenUserId = req.userId ? parseInt(req.userId) : null;

  if (!tokenUserId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }
  if (!postData?.title || !postData?.price || !postData?.city) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }
  if (!postDetail?.description?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Description is required",
    });
  }

  try {
    const newPost = await prisma.post.create({
      data: {
        title: postData.title,
        price: parseInt(postData.price),
        address: postData.address || "",
        city: postData.city,
        bedroom: postData.bedroom ? parseInt(postData.bedroom) : 1,
        bathroom: postData.bathroom ? parseInt(postData.bathroom) : 1,
        type: postData.type || "rent",
        property: postData.property || "apartment",
        latitude: postData.latitude ? parseFloat(postData.latitude) : 0,
        longitude: postData.longitude ? parseFloat(postData.longitude) : 0,
        images: postData.images || [],
        state: postData.state || "",
        country: postData.country || "",
        zipCode: postData.zipCode || "",
        ownershipType: postData.ownershipType || null,
        titleDeedStatus: postData.titleDeedStatus || null,
        hoaFees: postData.hoaFees ? parseFloat(postData.hoaFees) : null,
        propertyTaxes: postData.propertyTaxes
          ? parseFloat(postData.propertyTaxes)
          : null,
        financingOptions: postData.financingOptions || null,
        lotSize: postData.lotSize ? parseInt(postData.lotSize) : null,
        zoning: postData.zoning || null,
        owner: { connect: { id: tokenUserId } },
        postDetail: {
          create: {
            description: postDetail.description,
            utilities: postDetail.utilities || "owner",
            pet: postDetail.pet || "allowed",
            income: postDetail.income || "",
            size: postDetail.size ? parseInt(postDetail.size) : 0,
            school: postDetail.school ? parseInt(postDetail.school) : 0,
            bus: postDetail.bus ? parseInt(postDetail.bus) : 0,
            restaurant: postDetail.restaurant
              ? parseInt(postDetail.restaurant)
              : 0,
            wifi: postDetail.wifi || false,
            airConditioning: postDetail.airConditioning || false,
            parking: postDetail.parking || false,
            securityPersonnel: postDetail.securityPersonnel || false,
            furnished: postDetail.furnished || false,
            renovationHistory: postDetail.renovationHistory || null,
            includedAppliances: postDetail.includedAppliances || null,
            hoaAmenities: postDetail.hoaAmenities || null,
            energyEfficiency: postDetail.energyEfficiency || null,
            homeWarranty: postDetail.homeWarranty || false,
            airport: postDetail.airport ? parseInt(postDetail.airport) : null,
            supermarket: postDetail.supermarket
              ? parseInt(postDetail.supermarket)
              : null,
            shoppingMall: postDetail.shoppingMall
              ? parseInt(postDetail.shoppingMall)
              : null,
            nearestClub: postDetail.nearestClub
              ? parseInt(postDetail.nearestClub)
              : null,
            hospital: postDetail.hospital
              ? parseInt(postDetail.hospital)
              : null,
            beach: postDetail.beach ? parseInt(postDetail.beach) : null,
            publicTransport: postDetail.publicTransport
              ? parseInt(postDetail.publicTransport)
              : null,
            restaurants: postDetail.restaurants
              ? parseInt(postDetail.restaurants)
              : null,
          },
        },
      },
      include: {
        postDetail: true,
        owner: {
          select: {
            username: true,
            avatar: true,
          },
        },
        bookings: {
          where: { status: { in: ["confirmed", "completed"] } },
          select: {
            startDate: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const transformedPost = {
      ...newPost,
      images: Array.isArray(newPost.images) ? newPost.images : [],
    };

    res.status(201).json({
      success: true,
      data: transformedPost,
      message: "Post created successfully",
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const adminDeletePost = async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid post ID",
    });
  }
  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await prisma.$transaction([
      prisma.savedPost.deleteMany({ where: { postId: id } }),
      prisma.postDetail.deleteMany({ where: { postId: id } }),
      prisma.chat.deleteMany({ where: { postId: id } }),
      prisma.review.deleteMany({ where: { postId: id } }),
      prisma.booking.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully by admin",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  getAllPosts,
  getSinglePost,
  addPost,
  updatePost,
  deletePost,
  adminDeletePost,
};

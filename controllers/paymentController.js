const prisma = require("../lib/prisma");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const crypto = require("crypto");

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

// Encryption functions
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
};

const decrypt = (encryptedText) => {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Validation schemas
const paymentValidation = {
  amount: (value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
  currency: (value) =>
    ["USD", "EUR", "GBP", "NGN"].includes(value?.toUpperCase()),
  paymentMethod: (value) =>
    ["credit_card", "debit_card", "bank_transfer", "digital_wallet"].includes(
      value
    ),
  description: (value) =>
    !value || (typeof value === "string" && value.length <= 500),
};

const cardValidation = {
  cardNumber: (value) => /^\d{13,19}$/.test(value.replace(/\s/g, "")),
  expiryMonth: (value) => /^(0[1-9]|1[0-2])$/.test(value),
  expiryYear: (value) =>
    /^\d{4}$/.test(value) && parseInt(value) >= new Date().getFullYear(),
  holderName: (value) =>
    typeof value === "string" && value.length >= 2 && value.length <= 100,
  cvc: (value) => /^\d{3,4}$/.test(value),
};

const getAllPayments = async (req, res) => {
  try {
    const {
      status,
      userId,
      paymentMethod,
      transactionType,
      page = 1,
      limit = 20,
    } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (userId) whereClause.userId = parseInt(userId);
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;
    if (transactionType) whereClause.transactionType = transactionType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, username: true, email: true } },
          post: { select: { id: true, title: true, price: true } },
          card: { select: { id: true, lastFour: true, brand: true } },
          booking: { select: { id: true, totalAmount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};

const getSinglePayment = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        post: { select: { id: true, title: true, price: true } },
        card: { select: { id: true, lastFour: true, brand: true } },
        booking: { select: { id: true, totalAmount: true, status: true } },
        reviews: {
          include: {
            reviewer: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment" });
  }
};

const createPaymentIntent = async (req, res) => {
  const tokenUserId = req.userId ? parseInt(req.userId) : null;
  const { amount, currency, paymentMethod, postId, bookingDates, description } =
    req.body;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!paymentValidation.amount(amount)) {
    return res
      .status(400)
      .json({ success: false, message: "Valid amount is required" });
  }

  try {
    // Validating post exists and checking ownership
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        select: { id: true, ownerId: true, price: true, type: true },
      });
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }
      // Preventing owner from paying for their own property
      if (post.ownerId === tokenUserId) {
        return res.status(403).json({
          success: false,
          message: "You cannot pay for your own property",
        });
      }
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Converting NGN to kobo
      currency: (currency || "ngn").toLowerCase(), // Default to NGN
      payment_method_types: ["card"],
      metadata: {
        userId: tokenUserId.toString(),
        postId: postId ? parseInt(postId).toString() : "",
        bookingDates: bookingDates ? JSON.stringify(bookingDates) : "",
      },
    });

    res.status(201).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
      message: "Payment intent created successfully",
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    if (error.type === "StripeCardError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment intent" });
  }
};
const confirmPayment = async (req, res) => {
  const { paymentIntentId, bookingData, purchaseOptions, postId } = req.body;
  const tokenUserId = req.userId ? parseInt(req.userId) : null;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!paymentIntentId || !postId) {
    return res.status(400).json({
      success: false,
      message: "paymentIntentId and postId are required",
    });
  }

  try {
    // Verify the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // Validate post exists and check ownership
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { id: true, ownerId: true, type: true },
    });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (post.ownerId === tokenUserId) {
      return res.status(403).json({
        success: false,
        message: "You cannot pay for your own property",
      });
    }

    const payment = await prisma.$transaction(async (prisma) => {
      // Create Payment record
      const newPayment = await prisma.payment.create({
        data: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: "credit_card",
          description: null,
          userId: tokenUserId,
          postId: parseInt(postId),
          status: "completed",
          transactionId: paymentIntent.id,
          transactionType: bookingData ? "rental" : "sale",
          metadata: purchaseOptions ? JSON.stringify(purchaseOptions) : null,
          completedAt: new Date(),
        },
        include: {
          user: { select: { id: true, username: true, email: true } },
          post: { select: { id: true, title: true, type: true } },
        },
      });

      // Update Post for sales
      if (post.type === "buy") {
        await prisma.post.update({
          where: { id: parseInt(postId) },
          data: { isPaid: true },
        });
      }

      // Create or update Booking for rentals
      let booking = null;
      if (bookingData && post.type === "rent") {
        const startDate = new Date(bookingData.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(bookingData.endDate);
        endDate.setHours(0, 0, 0, 0);

        // Check for date conflicts
        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            postId: parseInt(postId),
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
              {
                startDate: { equals: startDate },
                endDate: { equals: endDate },
              },
            ],
            status: { in: ["confirmed", "active", "pending_payment"] },
          },
        });

        if (conflictingBooking) {
          throw new Error("Selected dates are not available");
        }

        booking = await prisma.booking.create({
          data: {
            postId: parseInt(postId),
            userId: tokenUserId,
            startDate,
            endDate,
            totalAmount: paymentIntent.amount / 100,
            status: "confirmed",
            guests: bookingData.guests || 1,
            paymentId: newPayment.id,
            confirmedAt: new Date(),
          },
        });
      }

      return { payment: newPayment, booking };
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        // No action needed, as confirmPayment handles this
        break;
      case "payment_intent.payment_failed":
        // No action needed, as no Payment record exists yet
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

const getUserCards = async (req, res) => {
  const tokenUserId = req.userId ? parseInt(req.userId) : null;
  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  try {
    const cards = await prisma.paymentCard.findMany({
      where: { userId: tokenUserId, isActive: true },
      orderBy: { isDefault: "desc" },
    });
    const decryptedCards = cards.map((card) => ({
      ...card,
      cardNumber: `•••• •••• •••• ${card.lastFour}`,
    }));
    res.status(200).json({ success: true, data: decryptedCards });
  } catch (error) {
    console.error("Error fetching user cards:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment cards" });
  }
};

const addPaymentCard = async (req, res) => {
  const tokenUserId = req.userId ? parseInt(req.userId) : null;
  const { token, isDefault } = req.body;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Payment token is required" });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: tokenUserId },
      select: { id: true, email: true, stripeCustomerId: true },
    });
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: tokenUserId.toString() },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: tokenUserId },
        data: { stripeCustomerId },
      });
    }

    const paymentMethod = await stripe.paymentMethods.attach(token, {
      customer: stripeCustomerId,
    });

    const card = await prisma.paymentCard.create({
      data: {
        stripePaymentMethodId: paymentMethod.id,
        lastFour: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        holderName: paymentMethod.billing_details.name || "",
        isDefault: isDefault || false,
        userId: tokenUserId,
      },
    });

    if (isDefault) {
      await prisma.paymentCard.updateMany({
        where: { userId: tokenUserId, id: { not: card.id } },
        data: { isDefault: false },
      });
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: card.id,
        lastFour: card.lastFour,
        brand: card.brand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        holderName: card.holderName,
        isDefault: card.isDefault,
      },
      message: "Card added successfully",
    });
  } catch (error) {
    console.error("Error adding payment card:", error);
    if (error.type === "StripeCardError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to add payment card" });
  }
};

const deletePaymentCard = async (req, res) => {
  const cardId = parseInt(req.params.id);
  const tokenUserId = req.userId ? parseInt(req.userId) : null;

  if (!tokenUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const card = await prisma.paymentCard.findUnique({
      where: { id: cardId, userId: tokenUserId },
    });
    if (!card) {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }

    if (card.stripePaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(card.stripePaymentMethodId);
      } catch (stripeError) {
        console.warn(
          "Could not detach payment method from Stripe:",
          stripeError
        );
      }
    }

    await prisma.paymentCard.delete({ where: { id: cardId } });

    res.status(200).json({
      success: true,
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment card:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete payment card" });
  }
};
const cleanupStalePayments = async (req, res) => {
  try {
    const stalePayments = await prisma.payment.findMany({
      where: {
        status: "pending",
        createdAt: { lte: new Date(Date.now() - 60 * 60 * 1000) }, // Older than 1 hour
      },
      include: { booking: true },
    });

    await prisma.$transaction(async (prisma) => {
      for (const payment of stalePayments) {
        if (payment.transactionId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              payment.transactionId
            );
            if (paymentIntent.status !== "succeeded") {
              await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "failed" },
              });
              if (payment.bookingId) {
                await prisma.booking.update({
                  where: { id: payment.bookingId },
                  data: { status: "cancelled", cancelledAt: new Date() },
                });
              }
            }
          } catch (stripeError) {
            console.warn("Could not retrieve payment intent:", stripeError);
            // Assume failure if Stripe API is unavailable
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: "failed" },
            });
            if (payment.bookingId) {
              await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: "cancelled", cancelledAt: new Date() },
              });
            }
          }
        }
      }
    });

    res
      .status(200)
      .json({ success: true, message: "Stale payments cleaned up" });
  } catch (error) {
    console.error("Error cleaning up payments:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to clean up payments" });
  }
};

module.exports = {
  getAllPayments,
  getSinglePayment,
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getUserCards,
  addPaymentCard,
  deletePaymentCard,
  cleanupStalePayments,
};

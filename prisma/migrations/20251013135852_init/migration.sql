-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'admin', 'support');

-- CreateEnum
CREATE TYPE "public"."Type" AS ENUM ('buy', 'rent');

-- CreateEnum
CREATE TYPE "public"."Property" AS ENUM ('apartment', 'villa', 'duplex', 'penthouse', 'townhouse', 'bungalow', 'loft', 'studio', 'chalet', 'cottage', 'mansion');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."AdminPermission" AS ENUM ('manage_users', 'manage_posts', 'manage_reviews', 'manage_payments', 'manage_admins', 'view_analytics', 'manage_settings');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('message', 'payment', 'review', 'system', 'admin', 'booking');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('sale', 'rental');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'rejected');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminPermissions" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "images" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT,
    "zipCode" TEXT,
    "bedroom" INTEGER NOT NULL,
    "bathroom" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "type" "public"."Type" NOT NULL,
    "property" "public"."Property" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownershipType" TEXT,
    "titleDeedStatus" TEXT,
    "hoaFees" DOUBLE PRECISION,
    "propertyTaxes" DOUBLE PRECISION,
    "financingOptions" TEXT,
    "lotSize" INTEGER,
    "zoning" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "minStay" INTEGER DEFAULT 1,
    "maxStay" INTEGER,
    "maxGuests" INTEGER,
    "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "depositPercentage" DOUBLE PRECISION,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostDetail" (
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "utilities" TEXT DEFAULT 'owner',
    "income" TEXT,
    "school" INTEGER,
    "bus" INTEGER,
    "restaurant" INTEGER,
    "wifi" BOOLEAN NOT NULL DEFAULT false,
    "airConditioning" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "securityPersonnel" BOOLEAN NOT NULL DEFAULT false,
    "pet" TEXT,
    "size" INTEGER,
    "floorNumber" INTEGER,
    "totalFloors" INTEGER,
    "yearBuilt" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "airport" INTEGER,
    "supermarket" INTEGER,
    "shoppingMall" INTEGER,
    "nearestClub" INTEGER,
    "hospital" INTEGER,
    "beach" INTEGER,
    "publicTransport" INTEGER,
    "restaurants" INTEGER,
    "additionalUtilities" TEXT,
    "postId" INTEGER NOT NULL,
    "renovationHistory" TEXT,
    "energyEfficiency" TEXT,
    "homeWarranty" BOOLEAN DEFAULT false,
    "includedAppliances" TEXT,
    "hoaAmenities" TEXT,

    CONSTRAINT "PostDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedPost" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReadBy" JSONB,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenBy" JSONB,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "public"."PaymentMethodType" NOT NULL,
    "transactionId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "transactionType" "public"."TransactionType",
    "userId" INTEGER NOT NULL,
    "postId" INTEGER,
    "cardId" INTEGER,
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentCard" (
    "id" SERIAL NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "holderName" TEXT NOT NULL,
    "brand" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastFour" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'approved',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "moderationReason" TEXT,
    "reviewerId" INTEGER NOT NULL,
    "revieweeId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "bookingId" INTEGER,
    "moderatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "specialRequests" TEXT,
    "paymentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" INTEGER,
    "relatedType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminActionLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" INTEGER,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_country_idx" ON "public"."UserProfile"("country");

-- CreateIndex
CREATE INDEX "UserProfile_state_idx" ON "public"."UserProfile"("state");

-- CreateIndex
CREATE INDEX "UserProfile_city_idx" ON "public"."UserProfile"("city");

-- CreateIndex
CREATE INDEX "Post_ownerId_idx" ON "public"."Post"("ownerId");

-- CreateIndex
CREATE INDEX "Post_latitude_longitude_idx" ON "public"."Post"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Post_isPaid_idx" ON "public"."Post"("isPaid");

-- CreateIndex
CREATE INDEX "Post_isActive_idx" ON "public"."Post"("isActive");

-- CreateIndex
CREATE INDEX "Post_country_idx" ON "public"."Post"("country");

-- CreateIndex
CREATE INDEX "Post_state_idx" ON "public"."Post"("state");

-- CreateIndex
CREATE INDEX "Post_city_idx" ON "public"."Post"("city");

-- CreateIndex
CREATE INDEX "Post_zipCode_idx" ON "public"."Post"("zipCode");

-- CreateIndex
CREATE INDEX "Post_type_idx" ON "public"."Post"("type");

-- CreateIndex
CREATE INDEX "Post_property_idx" ON "public"."Post"("property");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "public"."Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_isAvailable_idx" ON "public"."Post"("isAvailable");

-- CreateIndex
CREATE INDEX "Post_availableFrom_idx" ON "public"."Post"("availableFrom");

-- CreateIndex
CREATE INDEX "Post_maxGuests_idx" ON "public"."Post"("maxGuests");

-- CreateIndex
CREATE UNIQUE INDEX "PostDetail_postId_key" ON "public"."PostDetail"("postId");

-- CreateIndex
CREATE INDEX "PostDetail_wifi_idx" ON "public"."PostDetail"("wifi");

-- CreateIndex
CREATE INDEX "PostDetail_airConditioning_idx" ON "public"."PostDetail"("airConditioning");

-- CreateIndex
CREATE INDEX "PostDetail_parking_idx" ON "public"."PostDetail"("parking");

-- CreateIndex
CREATE INDEX "PostDetail_furnished_idx" ON "public"."PostDetail"("furnished");

-- CreateIndex
CREATE INDEX "PostDetail_size_idx" ON "public"."PostDetail"("size");

-- CreateIndex
CREATE INDEX "PostDetail_homeWarranty_idx" ON "public"."PostDetail"("homeWarranty");

-- CreateIndex
CREATE INDEX "SavedPost_userId_idx" ON "public"."SavedPost"("userId");

-- CreateIndex
CREATE INDEX "SavedPost_postId_idx" ON "public"."SavedPost"("postId");

-- CreateIndex
CREATE INDEX "SavedPost_createdAt_idx" ON "public"."SavedPost"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_userId_postId_key" ON "public"."SavedPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "Chat_postId_idx" ON "public"."Chat"("postId");

-- CreateIndex
CREATE INDEX "Chat_buyerId_idx" ON "public"."Chat"("buyerId");

-- CreateIndex
CREATE INDEX "Chat_sellerId_idx" ON "public"."Chat"("sellerId");

-- CreateIndex
CREATE INDEX "Chat_updatedAt_idx" ON "public"."Chat"("updatedAt");

-- CreateIndex
CREATE INDEX "Chat_isActive_idx" ON "public"."Chat"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_postId_buyerId_sellerId_key" ON "public"."Chat"("postId", "buyerId", "sellerId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "public"."Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "public"."Message"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "public"."Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_postId_idx" ON "public"."Payment"("postId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "public"."Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_transactionType_idx" ON "public"."Payment"("transactionType");

-- CreateIndex
CREATE INDEX "PaymentCard_userId_idx" ON "public"."PaymentCard"("userId");

-- CreateIndex
CREATE INDEX "PaymentCard_isActive_idx" ON "public"."PaymentCard"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCard_userId_lastFour_expiryMonth_expiryYear_key" ON "public"."PaymentCard"("userId", "lastFour", "expiryMonth", "expiryYear");

-- CreateIndex
CREATE UNIQUE INDEX "Review_paymentId_key" ON "public"."Review"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "public"."Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "public"."Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "public"."Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_postId_idx" ON "public"."Review"("postId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "public"."Review"("status");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "public"."Review"("createdAt");

-- CreateIndex
CREATE INDEX "Review_isVerified_idx" ON "public"."Review"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_postId_key" ON "public"."Review"("reviewerId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentId_key" ON "public"."Booking"("paymentId");

-- CreateIndex
CREATE INDEX "Booking_postId_idx" ON "public"."Booking"("postId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_startDate_endDate_idx" ON "public"."Booking"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "public"."Booking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_postId_startDate_endDate_key" ON "public"."Booking"("postId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "public"."Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_idx" ON "public"."AdminActionLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminActionLog_action_idx" ON "public"."AdminActionLog"("action");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_idx" ON "public"."AdminActionLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminActionLog_createdAt_idx" ON "public"."AdminActionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostDetail" ADD CONSTRAINT "PostDetail_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."PaymentCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentCard" ADD CONSTRAINT "PaymentCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('user', 'admin', 'support') NOT NULL DEFAULT 'user',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminPermissions` JSON NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_createdAt_idx`(`createdAt`),
    INDEX `User_isActive_idx`(`isActive`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    INDEX `UserProfile_country_idx`(`country`),
    INDEX `UserProfile_state_idx`(`state`),
    INDEX `UserProfile_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `images` JSON NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `bedroom` INTEGER NOT NULL,
    `bathroom` INTEGER NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `type` ENUM('buy', 'rent') NOT NULL,
    `property` ENUM('apartment', 'villa', 'duplex', 'penthouse', 'townhouse', 'bungalow', 'loft', 'studio', 'chalet', 'cottage', 'mansion') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownershipType` VARCHAR(191) NULL,
    `titleDeedStatus` VARCHAR(191) NULL,
    `hoaFees` DOUBLE NULL,
    `propertyTaxes` DOUBLE NULL,
    `financingOptions` VARCHAR(191) NULL,
    `lotSize` INTEGER NULL,
    `zoning` VARCHAR(191) NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `availableFrom` DATETIME(3) NULL,
    `minStay` INTEGER NULL DEFAULT 1,
    `maxStay` INTEGER NULL,
    `maxGuests` INTEGER NULL,
    `isNegotiable` BOOLEAN NOT NULL DEFAULT false,
    `depositPercentage` DOUBLE NULL,
    `ownerId` INTEGER NOT NULL,

    INDEX `Post_ownerId_idx`(`ownerId`),
    INDEX `Post_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `Post_isPaid_idx`(`isPaid`),
    INDEX `Post_isActive_idx`(`isActive`),
    INDEX `Post_country_idx`(`country`),
    INDEX `Post_state_idx`(`state`),
    INDEX `Post_city_idx`(`city`),
    INDEX `Post_zipCode_idx`(`zipCode`),
    INDEX `Post_type_idx`(`type`),
    INDEX `Post_property_idx`(`property`),
    INDEX `Post_createdAt_idx`(`createdAt`),
    INDEX `Post_isAvailable_idx`(`isAvailable`),
    INDEX `Post_availableFrom_idx`(`availableFrom`),
    INDEX `Post_maxGuests_idx`(`maxGuests`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `utilities` VARCHAR(191) NULL DEFAULT 'owner',
    `income` VARCHAR(191) NULL,
    `school` INTEGER NULL,
    `bus` INTEGER NULL,
    `restaurant` INTEGER NULL,
    `wifi` BOOLEAN NOT NULL DEFAULT false,
    `airConditioning` BOOLEAN NOT NULL DEFAULT false,
    `parking` BOOLEAN NOT NULL DEFAULT false,
    `securityPersonnel` BOOLEAN NOT NULL DEFAULT false,
    `pet` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `floorNumber` INTEGER NULL,
    `totalFloors` INTEGER NULL,
    `yearBuilt` INTEGER NULL,
    `furnished` BOOLEAN NOT NULL DEFAULT false,
    `airport` INTEGER NULL,
    `supermarket` INTEGER NULL,
    `shoppingMall` INTEGER NULL,
    `nearestClub` INTEGER NULL,
    `hospital` INTEGER NULL,
    `beach` INTEGER NULL,
    `publicTransport` INTEGER NULL,
    `restaurants` INTEGER NULL,
    `additionalUtilities` VARCHAR(191) NULL,
    `postId` INTEGER NOT NULL,
    `renovationHistory` VARCHAR(191) NULL,
    `energyEfficiency` VARCHAR(191) NULL,
    `homeWarranty` BOOLEAN NULL DEFAULT false,
    `includedAppliances` VARCHAR(191) NULL,
    `hoaAmenities` VARCHAR(191) NULL,

    UNIQUE INDEX `PostDetail_postId_key`(`postId`),
    INDEX `PostDetail_wifi_idx`(`wifi`),
    INDEX `PostDetail_airConditioning_idx`(`airConditioning`),
    INDEX `PostDetail_parking_idx`(`parking`),
    INDEX `PostDetail_furnished_idx`(`furnished`),
    INDEX `PostDetail_size_idx`(`size`),
    INDEX `PostDetail_homeWarranty_idx`(`homeWarranty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedPost_userId_idx`(`userId`),
    INDEX `SavedPost_postId_idx`(`postId`),
    INDEX `SavedPost_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `SavedPost_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `buyerId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastReadBy` JSON NULL,

    INDEX `Chat_postId_idx`(`postId`),
    INDEX `Chat_buyerId_idx`(`buyerId`),
    INDEX `Chat_sellerId_idx`(`sellerId`),
    INDEX `Chat_updatedAt_idx`(`updatedAt`),
    INDEX `Chat_isActive_idx`(`isActive`),
    UNIQUE INDEX `Chat_postId_buyerId_sellerId_key`(`postId`, `buyerId`, `sellerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seenBy` JSON NULL,

    INDEX `Message_chatId_idx`(`chatId`),
    INDEX `Message_senderId_idx`(`senderId`),
    INDEX `Message_createdAt_idx`(`createdAt`),
    INDEX `Message_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    `paymentMethod` ENUM('credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash') NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `transactionType` ENUM('sale', 'rental') NULL,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NULL,
    `cardId` INTEGER NULL,
    `bookingId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
    UNIQUE INDEX `Payment_bookingId_key`(`bookingId`),
    INDEX `Payment_userId_idx`(`userId`),
    INDEX `Payment_postId_idx`(`postId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_transactionId_idx`(`transactionId`),
    INDEX `Payment_createdAt_idx`(`createdAt`),
    INDEX `Payment_paymentMethod_idx`(`paymentMethod`),
    INDEX `Payment_transactionType_idx`(`transactionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentCard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cardNumber` VARCHAR(191) NOT NULL,
    `expiryMonth` INTEGER NOT NULL,
    `expiryYear` INTEGER NOT NULL,
    `holderName` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `lastFour` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentCard_userId_idx`(`userId`),
    INDEX `PaymentCard_isActive_idx`(`isActive`),
    UNIQUE INDEX `PaymentCard_userId_lastFour_expiryMonth_expiryYear_key`(`userId`, `lastFour`, `expiryMonth`, `expiryYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `comment` TEXT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `moderationReason` VARCHAR(191) NULL,
    `reviewerId` INTEGER NOT NULL,
    `revieweeId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,
    `paymentId` INTEGER NULL,
    `bookingId` INTEGER NULL,
    `moderatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Review_paymentId_key`(`paymentId`),
    UNIQUE INDEX `Review_bookingId_key`(`bookingId`),
    INDEX `Review_reviewerId_idx`(`reviewerId`),
    INDEX `Review_revieweeId_idx`(`revieweeId`),
    INDEX `Review_postId_idx`(`postId`),
    INDEX `Review_rating_idx`(`rating`),
    INDEX `Review_status_idx`(`status`),
    INDEX `Review_createdAt_idx`(`createdAt`),
    INDEX `Review_isVerified_idx`(`isVerified`),
    UNIQUE INDEX `Review_reviewerId_postId_key`(`reviewerId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending_payment',
    `totalAmount` DOUBLE NOT NULL,
    `guests` INTEGER NOT NULL DEFAULT 1,
    `specialRequests` VARCHAR(191) NULL,
    `paymentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `confirmedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Booking_paymentId_key`(`paymentId`),
    INDEX `Booking_postId_idx`(`postId`),
    INDEX `Booking_userId_idx`(`userId`),
    INDEX `Booking_startDate_endDate_idx`(`startDate`, `endDate`),
    INDEX `Booking_status_idx`(`status`),
    UNIQUE INDEX `Booking_postId_startDate_endDate_key`(`postId`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('message', 'payment', 'review', 'system', 'admin', 'booking') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `relatedId` INTEGER NULL,
    `relatedType` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    INDEX `Notification_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminActionLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` INTEGER NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminActionLog_adminId_idx`(`adminId`),
    INDEX `AdminActionLog_action_idx`(`action`),
    INDEX `AdminActionLog_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `AdminActionLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostDetail` ADD CONSTRAINT `PostDetail_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedPost` ADD CONSTRAINT `SavedPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedPost` ADD CONSTRAINT `SavedPost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `PaymentCard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentCard` ADD CONSTRAINT `PaymentCard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_moderatedById_fkey` FOREIGN KEY (`moderatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminActionLog` ADD CONSTRAINT `AdminActionLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."PromoDiscountType" AS ENUM ('PERCENT', 'AMOUNT');

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "appliedPromoCodeId" TEXT,
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoCodeCode" TEXT;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "appliedPromoCodeId" TEXT,
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "bedrooms" SET DATA TYPE TEXT,
ALTER COLUMN "bathrooms" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Realtor" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "pinterestUrl" TEXT,
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "vimeoUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."PromoCode" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "maxUsesPerRealtor" INTEGER,
    "maxUsesTotal" INTEGER,
    "discountType" "public"."PromoDiscountType" NOT NULL,
    "discountRateBps" INTEGER,
    "discountValueCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromoCodeService" (
    "promoCodeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeService_pkey" PRIMARY KEY ("promoCodeId","serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_adminId_code_key" ON "public"."PromoCode"("adminId", "code");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_appliedPromoCodeId_fkey" FOREIGN KEY ("appliedPromoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_appliedPromoCodeId_fkey" FOREIGN KEY ("appliedPromoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCode" ADD CONSTRAINT "PromoCode_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeService" ADD CONSTRAINT "PromoCodeService_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCodeService" ADD CONSTRAINT "PromoCodeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

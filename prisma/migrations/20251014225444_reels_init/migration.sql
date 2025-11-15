-- CreateEnum
CREATE TYPE "public"."ReelStatus" AS ENUM ('QUEUED', 'RENDERING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "public"."OrderReel" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL,
    "url" TEXT,
    "thumbnail" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderReelSourceImage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderReelSourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderReel_orderId_status_idx" ON "public"."OrderReel"("orderId", "status");

-- CreateIndex
CREATE INDEX "OrderReelSourceImage_orderId_sortOrder_idx" ON "public"."OrderReelSourceImage"("orderId", "sortOrder");

-- AddForeignKey
ALTER TABLE "public"."OrderReel" ADD CONSTRAINT "OrderReel_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderReelSourceImage" ADD CONSTRAINT "OrderReelSourceImage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

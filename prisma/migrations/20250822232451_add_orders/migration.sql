-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "propertyAddress" TEXT NOT NULL,
    "propertySize" INTEGER,
    "yearBuilt" INTEGER,
    "mlsNumber" TEXT,
    "listPrice" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_slug_key" ON "public"."Order"("slug");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."Realtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

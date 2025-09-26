/*
  Warnings:

  - A unique constraint covering the columns `[adminSlug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "adminSlug" TEXT;

-- CreateTable
CREATE TABLE "public"."ServiceCategory" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "bufferBeforeMin" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMin" INTEGER NOT NULL DEFAULT 0,
    "minSqFt" INTEGER,
    "maxSqFt" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tax" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceTax" (
    "serviceId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,

    CONSTRAINT "ServiceTax_pkey" PRIMARY KEY ("serviceId","taxId")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "realtorId" TEXT,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyFormattedAddress" TEXT,
    "propertyLat" DOUBLE PRECISION,
    "propertyLng" DOUBLE PRECISION,
    "propertyCity" TEXT,
    "propertyProvince" TEXT,
    "propertyPostalCode" TEXT,
    "propertyCountry" TEXT,
    "propertyPlaceId" TEXT,
    "propertySizeSqFt" INTEGER,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "notes" TEXT,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAvailabilityRule" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "timeZone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdminAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlackoutDate" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarAccount" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "CalendarAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminBookingSettings" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "leadTimeMin" INTEGER NOT NULL DEFAULT 0,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 60,
    "defaultBufferMin" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdminBookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCategory_adminId_name_idx" ON "public"."ServiceCategory"("adminId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_adminId_slug_key" ON "public"."ServiceCategory"("adminId", "slug");

-- CreateIndex
CREATE INDEX "Service_adminId_categoryId_active_idx" ON "public"."Service"("adminId", "categoryId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Service_adminId_slug_key" ON "public"."Service"("adminId", "slug");

-- CreateIndex
CREATE INDEX "Tax_adminId_active_idx" ON "public"."Tax"("adminId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Tax_adminId_name_key" ON "public"."Tax"("adminId", "name");

-- CreateIndex
CREATE INDEX "Booking_adminId_start_end_idx" ON "public"."Booking"("adminId", "start", "end");

-- CreateIndex
CREATE INDEX "Booking_realtorId_idx" ON "public"."Booking"("realtorId");

-- CreateIndex
CREATE INDEX "AdminAvailabilityRule_adminId_dayOfWeek_idx" ON "public"."AdminAvailabilityRule"("adminId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BlackoutDate_adminId_start_end_idx" ON "public"."BlackoutDate"("adminId", "start", "end");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarAccount_adminId_provider_key" ON "public"."CalendarAccount"("adminId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AdminBookingSettings_adminId_key" ON "public"."AdminBookingSettings"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "User_adminSlug_key" ON "public"."User"("adminSlug");

-- AddForeignKey
ALTER TABLE "public"."ServiceCategory" ADD CONSTRAINT "ServiceCategory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tax" ADD CONSTRAINT "Tax_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTax" ADD CONSTRAINT "ServiceTax_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTax" ADD CONSTRAINT "ServiceTax_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "public"."Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAvailabilityRule" ADD CONSTRAINT "AdminAvailabilityRule_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlackoutDate" ADD CONSTRAINT "BlackoutDate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarAccount" ADD CONSTRAINT "CalendarAccount_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminBookingSettings" ADD CONSTRAINT "AdminBookingSettings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

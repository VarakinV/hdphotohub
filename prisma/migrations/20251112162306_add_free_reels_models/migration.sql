-- CreateEnum
CREATE TYPE "public"."FreeLeadStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "public"."FreeReelsLead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyCity" TEXT,
    "propertyPostalCode" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "headshotUrl" TEXT,
    "agencyLogoUrl" TEXT,
    "status" "public"."FreeLeadStatus" NOT NULL DEFAULT 'DRAFT',
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeReelsLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeReelsSourceImage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeReelsSourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeReel" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
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

    CONSTRAINT "FreeReel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeReelsSourceImage_leadId_sortOrder_idx" ON "public"."FreeReelsSourceImage"("leadId", "sortOrder");

-- CreateIndex
CREATE INDEX "FreeReel_leadId_status_idx" ON "public"."FreeReel"("leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FreeReel_provider_renderId_key" ON "public"."FreeReel"("provider", "renderId");

-- AddForeignKey
ALTER TABLE "public"."FreeReelsSourceImage" ADD CONSTRAINT "FreeReelsSourceImage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeReelsLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeReel" ADD CONSTRAINT "FreeReel_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeReelsLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

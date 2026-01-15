-- CreateTable
CREATE TABLE "public"."FreeSlideshowLead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyCity" TEXT,
    "propertyPostalCode" TEXT,
    "bedrooms" TEXT,
    "bathrooms" TEXT,
    "sizeSqFt" TEXT,
    "headshotUrl" TEXT,
    "agencyLogoUrl" TEXT,
    "status" "public"."FreeLeadStatus" NOT NULL DEFAULT 'DRAFT',
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeSlideshowLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeSlideshowSourceImage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeSlideshowSourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeSlideshow" (
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

    CONSTRAINT "FreeSlideshow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeSlideshowSourceImage_leadId_sortOrder_idx" ON "public"."FreeSlideshowSourceImage"("leadId", "sortOrder");

-- CreateIndex
CREATE INDEX "FreeSlideshow_leadId_status_idx" ON "public"."FreeSlideshow"("leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FreeSlideshow_provider_renderId_key" ON "public"."FreeSlideshow"("provider", "renderId");

-- AddForeignKey
ALTER TABLE "public"."FreeSlideshowSourceImage" ADD CONSTRAINT "FreeSlideshowSourceImage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeSlideshowLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeSlideshow" ADD CONSTRAINT "FreeSlideshow_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeSlideshowLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."FreeFlyersLead" (
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
    "sizeSqFt" TEXT,
    "propertySiteUrl" TEXT,
    "headshotUrl" TEXT,
    "agencyLogoUrl" TEXT,
    "status" "public"."FreeLeadStatus" NOT NULL DEFAULT 'DRAFT',
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeFlyersLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeFlyersSourceImage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeFlyersSourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeFlyer" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL,
    "url" TEXT,
    "previewUrl" TEXT,
    "pageWidth" INTEGER,
    "pageHeight" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeFlyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeFlyersSourceImage_leadId_sortOrder_idx" ON "public"."FreeFlyersSourceImage"("leadId", "sortOrder");

-- CreateIndex
CREATE INDEX "FreeFlyer_leadId_status_idx" ON "public"."FreeFlyer"("leadId", "status");

-- AddForeignKey
ALTER TABLE "public"."FreeFlyersSourceImage" ADD CONSTRAINT "FreeFlyersSourceImage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeFlyersLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeFlyer" ADD CONSTRAINT "FreeFlyer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeFlyersLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

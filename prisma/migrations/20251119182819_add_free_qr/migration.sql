-- CreateTable
CREATE TABLE "public"."FreeQrLead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "status" "public"."FreeLeadStatus" NOT NULL DEFAULT 'COMPLETE',
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeQrLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeQr" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL DEFAULT 'COMPLETE',
    "svgUrl" TEXT,
    "pngUrl" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeQr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeQr_leadId_status_idx" ON "public"."FreeQr"("leadId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FreeQr_leadId_variantKey_key" ON "public"."FreeQr"("leadId", "variantKey");

-- AddForeignKey
ALTER TABLE "public"."FreeQr" ADD CONSTRAINT "FreeQr_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."FreeQrLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

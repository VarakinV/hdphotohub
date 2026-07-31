-- CreateEnum
CREATE TYPE "public"."QRCodeStatus" AS ENUM ('UNASSIGNED', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('WEBSITE', 'QR_CODE');

-- AlterTable
ALTER TABLE "public"."PropertyInquiry" ADD COLUMN     "qrAssignmentId" TEXT,
ADD COLUMN     "source" "public"."LeadSource" NOT NULL DEFAULT 'WEBSITE',
ALTER COLUMN "message" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."QRCode" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "displayId" TEXT NOT NULL,
    "status" "public"."QRCodeStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRAssignment" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "propertyPageId" TEXT,
    "sendWeeklyStats" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "QRAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRScanEvent" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionHash" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "QRScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRPrintable" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL DEFAULT 'QUEUED',
    "svgUrl" TEXT,
    "pngUrl" TEXT,
    "pdfUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRPrintable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_seq_key" ON "public"."QRCode"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_displayId_key" ON "public"."QRCode"("displayId");

-- CreateIndex
CREATE INDEX "QRCode_status_idx" ON "public"."QRCode"("status");

-- CreateIndex
CREATE INDEX "QRAssignment_qrCodeId_unassignedAt_idx" ON "public"."QRAssignment"("qrCodeId", "unassignedAt");

-- CreateIndex
CREATE INDEX "QRAssignment_orderId_idx" ON "public"."QRAssignment"("orderId");

-- CreateIndex
CREATE INDEX "QRScanEvent_assignmentId_scannedAt_idx" ON "public"."QRScanEvent"("assignmentId", "scannedAt");

-- CreateIndex
CREATE INDEX "QRPrintable_qrCodeId_status_idx" ON "public"."QRPrintable"("qrCodeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QRPrintable_qrCodeId_variantKey_key" ON "public"."QRPrintable"("qrCodeId", "variantKey");

-- CreateIndex
CREATE INDEX "PropertyInquiry_qrAssignmentId_idx" ON "public"."PropertyInquiry"("qrAssignmentId");

-- AddForeignKey
ALTER TABLE "public"."PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_qrAssignmentId_fkey" FOREIGN KEY ("qrAssignmentId") REFERENCES "public"."QRAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRCode" ADD CONSTRAINT "QRCode_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRAssignment" ADD CONSTRAINT "QRAssignment_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRAssignment" ADD CONSTRAINT "QRAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRAssignment" ADD CONSTRAINT "QRAssignment_propertyPageId_fkey" FOREIGN KEY ("propertyPageId") REFERENCES "public"."PropertyPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRScanEvent" ADD CONSTRAINT "QRScanEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."QRAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QRPrintable" ADD CONSTRAINT "QRPrintable_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "public"."QRCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

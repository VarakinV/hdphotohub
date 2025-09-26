-- AlterTable
ALTER TABLE "public"."Photo" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Photo_orderId_sortOrder_idx" ON "public"."Photo"("orderId", "sortOrder");

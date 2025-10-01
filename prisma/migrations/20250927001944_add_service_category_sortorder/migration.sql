-- AlterTable
ALTER TABLE "public"."ServiceCategory" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ServiceCategory_adminId_sortOrder_idx" ON "public"."ServiceCategory"("adminId", "sortOrder");

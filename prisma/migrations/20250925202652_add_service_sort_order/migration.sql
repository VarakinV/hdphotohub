-- DropIndex
DROP INDEX "public"."Service_adminId_categoryId_active_idx";

-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Service_adminId_sortOrder_idx" ON "public"."Service"("adminId", "sortOrder");

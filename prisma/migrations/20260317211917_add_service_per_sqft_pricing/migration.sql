-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "isPerSqFt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minPriceCents" INTEGER;

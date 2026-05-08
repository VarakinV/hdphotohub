-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "travelCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "travelCalculationText" TEXT,
ADD COLUMN     "travelDistanceMeters" INTEGER,
ADD COLUMN     "travelDurationSeconds" INTEGER,
ADD COLUMN     "travelFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "travelRule" TEXT;

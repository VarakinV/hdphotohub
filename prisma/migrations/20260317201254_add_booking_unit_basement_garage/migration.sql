-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "basementMeasure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "basementPhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "garageMeasure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "garagePhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unitNumber" TEXT;

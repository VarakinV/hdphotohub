-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminderForStart" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_status_start_idx" ON "Booking"("status", "start");
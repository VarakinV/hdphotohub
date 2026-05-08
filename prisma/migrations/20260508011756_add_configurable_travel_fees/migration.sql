-- AlterTable
ALTER TABLE "public"."AdminBookingSettings" ADD COLUMN     "travelFreeRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 35,
ADD COLUMN     "travelPerKmRateCents" INTEGER NOT NULL DEFAULT 85;

-- CreateTable
CREATE TABLE "public"."AdminTravelFlatFeeTown" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminTravelFlatFeeTown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminTravelFlatFeeTown_adminId_idx" ON "public"."AdminTravelFlatFeeTown"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminTravelFlatFeeTown_adminId_cityName_key" ON "public"."AdminTravelFlatFeeTown"("adminId", "cityName");

-- AddForeignKey
ALTER TABLE "public"."AdminTravelFlatFeeTown" ADD CONSTRAINT "AdminTravelFlatFeeTown_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

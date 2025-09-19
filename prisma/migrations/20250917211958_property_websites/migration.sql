-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "featuresText" TEXT,
ADD COLUMN     "propertyFormattedAddress" TEXT,
ADD COLUMN     "propertyLat" DOUBLE PRECISION,
ADD COLUMN     "propertyLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Realtor" ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "companyName" TEXT;

-- CreateTable
CREATE TABLE "public"."PropertyPage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "template" INTEGER NOT NULL,
    "urlPath" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyInquiry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyInquiry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PropertyPage" ADD CONSTRAINT "PropertyPage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

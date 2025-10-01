-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "propertyAddressOverride" TEXT,
ADD COLUMN     "propertyCityOverride" TEXT,
ADD COLUMN     "propertyPostalCodeOverride" TEXT;

-- Add generic tiered pricing support for services and quantity snapshots for bookings.
ALTER TABLE "Service" ADD COLUMN "tieredPricing" JSONB;

UPDATE "Service"
SET
  "priceCents" = 3500,
  "tieredPricing" = '{"enabled":true,"unitLabel":"image","tiers":[{"quantity":1,"priceCents":3500},{"quantity":3,"priceCents":10000},{"quantity":6,"priceCents":20000},{"quantity":10,"priceCents":30000}]}'::jsonb
WHERE lower("name") = 'virtual staging' OR "slug" ILIKE '%virtual-staging%';

ALTER TABLE "BookingService" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BookingService" ADD COLUMN "quantityLabel" TEXT;
-- CreateTable
CREATE TABLE "public"."SocialPostTemplate" (
    "id" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPostTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderSocialPost" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL DEFAULT 'QUEUED',
    "url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostTemplate_variantKey_key" ON "public"."SocialPostTemplate"("variantKey");

-- CreateIndex
CREATE INDEX "SocialPostTemplate_status_idx" ON "public"."SocialPostTemplate"("status");

-- CreateIndex
CREATE INDEX "OrderSocialPost_orderId_status_idx" ON "public"."OrderSocialPost"("orderId", "status");

-- CreateIndex
CREATE INDEX "OrderSocialPost_orderId_variantKey_idx" ON "public"."OrderSocialPost"("orderId", "variantKey");

-- AddForeignKey
ALTER TABLE "public"."OrderSocialPost" ADD CONSTRAINT "OrderSocialPost_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."OrderFlyer" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "status" "public"."ReelStatus" NOT NULL,
    "url" TEXT,
    "previewUrl" TEXT,
    "pageWidth" INTEGER,
    "pageHeight" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderFlyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderFlyer_orderId_status_idx" ON "public"."OrderFlyer"("orderId", "status");

-- AddForeignKey
ALTER TABLE "public"."OrderFlyer" ADD CONSTRAINT "OrderFlyer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

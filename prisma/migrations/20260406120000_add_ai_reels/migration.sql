-- CreateEnum
CREATE TYPE "AiReelStepStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "OrderAiReel" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sourceImageUrl" TEXT NOT NULL,
    "kieImageTaskId" TEXT,
    "kieImageStatus" "AiReelStepStatus" NOT NULL DEFAULT 'PENDING',
    "twilightImageUrl" TEXT,
    "kieVideoTaskId" TEXT,
    "kieVideoStatus" "AiReelStepStatus" NOT NULL DEFAULT 'PENDING',
    "videoUrl" TEXT,
    "j2vRenderId" TEXT,
    "j2vStatus" "AiReelStepStatus" NOT NULL DEFAULT 'PENDING',
    "finalUrl" TEXT,
    "thumbnail" TEXT,
    "width" INTEGER DEFAULT 1080,
    "height" INTEGER DEFAULT 1920,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAiReel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAiReel_orderId_idx" ON "OrderAiReel"("orderId");

-- CreateIndex
CREATE INDEX "OrderAiReel_kieImageTaskId_idx" ON "OrderAiReel"("kieImageTaskId");

-- CreateIndex
CREATE INDEX "OrderAiReel_kieVideoTaskId_idx" ON "OrderAiReel"("kieVideoTaskId");

-- CreateIndex
CREATE INDEX "OrderAiReel_j2vRenderId_idx" ON "OrderAiReel"("j2vRenderId");

-- AddForeignKey
ALTER TABLE "OrderAiReel" ADD CONSTRAINT "OrderAiReel_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

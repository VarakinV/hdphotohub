-- AlterTable
ALTER TABLE "public"."OrderReel" ADD COLUMN     "musicTrackId" TEXT;

-- CreateTable
CREATE TABLE "public"."VideoMusicTrack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "genre" TEXT,
    "mood" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoMusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoTemplate" (
    "id" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'remotion',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "durationInFrames" INTEGER NOT NULL,
    "compositionId" TEXT NOT NULL,
    "schemaJson" JSONB,
    "defaultMusicTrackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoMusicTrack_isActive_idx" ON "public"."VideoMusicTrack"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTemplate_variantKey_key" ON "public"."VideoTemplate"("variantKey");

-- CreateIndex
CREATE INDEX "VideoTemplate_status_provider_idx" ON "public"."VideoTemplate"("status", "provider");

-- CreateIndex
CREATE INDEX "OrderReel_musicTrackId_idx" ON "public"."OrderReel"("musicTrackId");

-- AddForeignKey
ALTER TABLE "public"."OrderReel" ADD CONSTRAINT "OrderReel_musicTrackId_fkey" FOREIGN KEY ("musicTrackId") REFERENCES "public"."VideoMusicTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoTemplate" ADD CONSTRAINT "VideoTemplate_defaultMusicTrackId_fkey" FOREIGN KEY ("defaultMusicTrackId") REFERENCES "public"."VideoMusicTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

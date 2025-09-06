-- CreateTable
CREATE TABLE "public"."Photo" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlMls" TEXT,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Video" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FloorPlan" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Embed" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Photo" ADD CONSTRAINT "Photo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FloorPlan" ADD CONSTRAINT "FloorPlan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Embed" ADD CONSTRAINT "Embed_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."RealtorAssignment" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RealtorAssignment_adminId_realtorId_key" ON "public"."RealtorAssignment"("adminId", "realtorId");

-- AddForeignKey
ALTER TABLE "public"."RealtorAssignment" ADD CONSTRAINT "RealtorAssignment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RealtorAssignment" ADD CONSTRAINT "RealtorAssignment_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."Realtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

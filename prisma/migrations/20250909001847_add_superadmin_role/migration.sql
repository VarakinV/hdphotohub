-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'REALTOR';

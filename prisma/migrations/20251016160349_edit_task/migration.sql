-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TaskStatus" ADD VALUE 'REJECTED';
ALTER TYPE "public"."TaskStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "public"."Employee" ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "isTeamTask" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT;

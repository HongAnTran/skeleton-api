/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `completedBy` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedBy` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedReason` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TaskCycleV2` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `TaskV2` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `TaskCycleV2` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskV2" DROP CONSTRAINT "TaskV2_employeeId_fkey";

-- AlterTable
ALTER TABLE "TaskCycleV2" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "completedAt",
DROP COLUMN "completedBy",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectedBy",
DROP COLUMN "rejectedReason",
DROP COLUMN "status",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TaskV2" DROP COLUMN "employeeId";

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "TaskStatusV2" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAssignment_cycleId_idx" ON "TaskAssignment"("cycleId");

-- CreateIndex
CREATE INDEX "TaskAssignment_employeeId_idx" ON "TaskAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "TaskAssignment_status_idx" ON "TaskAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_cycleId_employeeId_key" ON "TaskAssignment"("cycleId", "employeeId");

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "TaskCycleV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

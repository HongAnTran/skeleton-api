/*
  Warnings:

  - You are about to drop the `TaskApproval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskCycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskInstance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskProgressEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskApproval" DROP CONSTRAINT "TaskApproval_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCycle" DROP CONSTRAINT "TaskCycle_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "TaskInstance" DROP CONSTRAINT "TaskInstance_cycleId_fkey";

-- DropForeignKey
ALTER TABLE "TaskInstance" DROP CONSTRAINT "TaskInstance_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "TaskInstance" DROP CONSTRAINT "TaskInstance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "TaskInstance" DROP CONSTRAINT "TaskInstance_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TaskProgressEvent" DROP CONSTRAINT "TaskProgressEvent_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "TaskSchedule" DROP CONSTRAINT "TaskSchedule_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TaskTemplate" DROP CONSTRAINT "TaskTemplate_userId_fkey";

-- DropTable
DROP TABLE "TaskApproval";

-- DropTable
DROP TABLE "TaskCycle";

-- DropTable
DROP TABLE "TaskInstance";

-- DropTable
DROP TABLE "TaskProgressEvent";

-- DropTable
DROP TABLE "TaskSchedule";

-- DropTable
DROP TABLE "TaskTemplate";

-- DropEnum
DROP TYPE "Aggregation";

-- DropEnum
DROP TYPE "Frequency";

-- DropEnum
DROP TYPE "TaskScope";

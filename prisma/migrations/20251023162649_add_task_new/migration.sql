-- CreateEnum
CREATE TYPE "TaskStatusV2" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TaskScope" AS ENUM ('INDIVIDUAL', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "Aggregation" AS ENUM ('COUNT', 'SUM', 'AVERAGE', 'MAX', 'MIN');

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" "TaskScope" NOT NULL,
    "unit" TEXT,
    "defaultTarget" DOUBLE PRECISION,
    "aggregation" "Aggregation" NOT NULL DEFAULT 'COUNT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSchedule" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCycle" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TaskStatusV2" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "TaskCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "scope" "TaskScope" NOT NULL,
    "employeeId" TEXT,
    "departmentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
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

    CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskProgressEvent" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TaskProgressEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskApproval" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "actedBy" TEXT NOT NULL,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCycle_scheduleId_periodStart_periodEnd_key" ON "TaskCycle"("scheduleId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "TaskInstance_cycleId_scope_level_status_idx" ON "TaskInstance"("cycleId", "scope", "level", "status");

-- CreateIndex
CREATE INDEX "TaskInstance_employeeId_idx" ON "TaskInstance"("employeeId");

-- CreateIndex
CREATE INDEX "TaskInstance_departmentId_idx" ON "TaskInstance"("departmentId");

-- CreateIndex
CREATE INDEX "TaskProgressEvent_instanceId_occurredAt_idx" ON "TaskProgressEvent"("instanceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSchedule" ADD CONSTRAINT "TaskSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCycle" ADD CONSTRAINT "TaskCycle_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TaskSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "TaskCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgressEvent" ADD CONSTRAINT "TaskProgressEvent_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "TaskInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApproval" ADD CONSTRAINT "TaskApproval_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "TaskInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

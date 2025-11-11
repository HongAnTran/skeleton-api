-- CreateTable
CREATE TABLE "TaskV2" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isTaskTeam" BOOLEAN NOT NULL DEFAULT false,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCycleV2" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatusV2" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedReason" TEXT,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "TaskCycleV2_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskV2" ADD CONSTRAINT "TaskV2_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskV2" ADD CONSTRAINT "TaskV2_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskV2" ADD CONSTRAINT "TaskV2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCycleV2" ADD CONSTRAINT "TaskCycleV2_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

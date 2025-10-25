-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "currentLevel" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TaskInstance" ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "aggregation" DROP NOT NULL,
ALTER COLUMN "aggregation" DROP DEFAULT;

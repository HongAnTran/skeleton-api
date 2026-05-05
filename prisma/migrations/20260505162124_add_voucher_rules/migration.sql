-- CreateEnum
CREATE TYPE "public"."VoucherConditionType" AS ENUM ('INVOICE_COUNT_TIER', 'WARRANTY_ACTIVE');

-- CreateTable
CREATE TABLE "public"."VoucherRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conditionType" "public"."VoucherConditionType" NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "discountVnd" INTEGER NOT NULL,
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoucherRule_conditionType_isActive_idx" ON "public"."VoucherRule"("conditionType", "isActive");

-- CreateIndex
CREATE INDEX "VoucherRule_isActive_idx" ON "public"."VoucherRule"("isActive");

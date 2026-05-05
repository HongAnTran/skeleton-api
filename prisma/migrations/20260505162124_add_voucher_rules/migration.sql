-- CreateEnum
CREATE TYPE "public"."VoucherConditionType" AS ENUM ('INVOICE_COUNT_TIER', 'WARRANTY_ACTIVE');

-- CreateTable
CREATE TABLE "public"."UserAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAdmin_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "UserAdmin_accountId_key" ON "public"."UserAdmin"("accountId");

-- CreateIndex
CREATE INDEX "UserAdmin_userId_idx" ON "public"."UserAdmin"("userId");

-- CreateIndex
CREATE INDEX "UserAdmin_accountId_idx" ON "public"."UserAdmin"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAdmin_userId_accountId_key" ON "public"."UserAdmin"("userId", "accountId");

-- CreateIndex
CREATE INDEX "VoucherRule_conditionType_isActive_idx" ON "public"."VoucherRule"("conditionType", "isActive");

-- CreateIndex
CREATE INDEX "VoucherRule_isActive_idx" ON "public"."VoucherRule"("isActive");

-- AddForeignKey
ALTER TABLE "public"."UserAdmin" ADD CONSTRAINT "UserAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAdmin" ADD CONSTRAINT "UserAdmin_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

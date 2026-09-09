-- CreateEnum
CREATE TYPE "LeaveKind" AS ENUM ('DAILY', 'HOURLY');
CREATE TYPE "LeaveGrantSource" AS ENUM ('REQUEST', 'BONUS');

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "kind" "LeaveKind" NOT NULL DEFAULT 'DAILY',
ADD COLUMN "hours" DECIMAL(6,2),
ADD COLUMN "source" "LeaveGrantSource" NOT NULL DEFAULT 'REQUEST';

-- CreateTable
CREATE TABLE "LeaveBalanceAdjustment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "LeaveKind" NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveBalanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveBalanceAdjustment_companyId_userId_idx" ON "LeaveBalanceAdjustment"("companyId", "userId");

-- AddForeignKey
ALTER TABLE "LeaveBalanceAdjustment" ADD CONSTRAINT "LeaveBalanceAdjustment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveBalanceAdjustment" ADD CONSTRAINT "LeaveBalanceAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveBalanceAdjustment" ADD CONSTRAINT "LeaveBalanceAdjustment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

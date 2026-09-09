-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'SNOOZED', 'ACKED', 'DISABLED');
CREATE TYPE "ReminderTargetKind" AS ENUM ('TASK', 'NOTE', 'MEETING', 'CUSTOM');

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "targetKind" "ReminderTargetKind" NOT NULL,
    "targetId" TEXT,
    "title" TEXT NOT NULL,
    "fireAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_companyId_fireAt_status_idx" ON "Reminder"("companyId", "fireAt", "status");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

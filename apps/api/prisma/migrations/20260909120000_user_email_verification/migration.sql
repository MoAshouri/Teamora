-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "pendingEmail" TEXT,
ADD COLUMN "pendingEmailRequestedAt" TIMESTAMP(3);

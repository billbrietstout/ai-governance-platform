/*
  Warnings:

  - A unique constraint covering the columns `[unsubscribeToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "slackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slackWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "unsubscribeToken" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_unsubscribeToken_key" ON "User"("unsubscribeToken");

/*
  Warnings:

  - You are about to drop the `ISOReadiness` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ISOReadiness" DROP CONSTRAINT "ISOReadiness_orgId_fkey";

-- DropTable
DROP TABLE "ISOReadiness";

-- CreateTable
CREATE TABLE "IsoReadiness" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "IsoReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IsoReadiness_orgId_idx" ON "IsoReadiness"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "IsoReadiness_orgId_clauseId_key" ON "IsoReadiness"("orgId", "clauseId");

-- AddForeignKey
ALTER TABLE "IsoReadiness" ADD CONSTRAINT "IsoReadiness_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

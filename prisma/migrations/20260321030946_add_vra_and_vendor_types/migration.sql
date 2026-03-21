-- CreateEnum
CREATE TYPE "VraAnswer" AS ENUM ('YES', 'NO', 'NA', 'PARTIAL', 'UNKNOWN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VendorType" ADD VALUE 'CONSULTING';
ALTER TYPE "VendorType" ADD VALUE 'RESELLER';

-- CreateTable
CREATE TABLE "VendorVraResponse" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" "VraAnswer" NOT NULL,
    "evidenceUrl" TEXT,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,

    CONSTRAINT "VendorVraResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorVraResponse_orgId_idx" ON "VendorVraResponse"("orgId");

-- CreateIndex
CREATE INDEX "VendorVraResponse_vendorId_idx" ON "VendorVraResponse"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorVraResponse_vendorId_questionId_key" ON "VendorVraResponse"("vendorId", "questionId");

-- AddForeignKey
ALTER TABLE "VendorVraResponse" ADD CONSTRAINT "VendorVraResponse_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAssurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

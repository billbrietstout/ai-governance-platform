-- CreateEnum
CREATE TYPE "MasterDataEntityType" AS ENUM ('CUSTOMER', 'PRODUCT', 'VENDOR', 'EMPLOYEE', 'FINANCE', 'LOCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AiAccessPolicy" AS ENUM ('OPEN', 'GOVERNED', 'RESTRICTED', 'PROHIBITED');

-- CreateTable
CREATE TABLE "MasterDataEntity" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" "MasterDataEntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stewardId" TEXT,
    "classification" "DataClassification" NOT NULL DEFAULT 'INTERNAL',
    "qualityScore" DOUBLE PRECISION,
    "recordCount" INTEGER,
    "sourceSystem" TEXT,
    "aiAccessPolicy" "AiAccessPolicy" NOT NULL DEFAULT 'RESTRICTED',
    "lastReviewed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterDataEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLineageRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceEntityId" TEXT,
    "targetAssetId" TEXT,
    "pipelineType" TEXT NOT NULL,
    "transformations" TEXT,
    "refreshFrequency" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'INTERNAL',
    "ownerId" TEXT,
    "lastRun" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataLineageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataGovernancePolicy" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appliesTo" "DataClassification"[],
    "controls" TEXT[],
    "ownerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataGovernancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterDataEntity_orgId_idx" ON "MasterDataEntity"("orgId");

-- CreateIndex
CREATE INDEX "MasterDataEntity_stewardId_idx" ON "MasterDataEntity"("stewardId");

-- CreateIndex
CREATE INDEX "DataLineageRecord_orgId_idx" ON "DataLineageRecord"("orgId");

-- CreateIndex
CREATE INDEX "DataLineageRecord_sourceEntityId_idx" ON "DataLineageRecord"("sourceEntityId");

-- CreateIndex
CREATE INDEX "DataLineageRecord_targetAssetId_idx" ON "DataLineageRecord"("targetAssetId");

-- CreateIndex
CREATE INDEX "DataGovernancePolicy_orgId_idx" ON "DataGovernancePolicy"("orgId");

-- AddForeignKey
ALTER TABLE "MasterDataEntity" ADD CONSTRAINT "MasterDataEntity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterDataEntity" ADD CONSTRAINT "MasterDataEntity_stewardId_fkey" FOREIGN KEY ("stewardId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageRecord" ADD CONSTRAINT "DataLineageRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageRecord" ADD CONSTRAINT "DataLineageRecord_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "MasterDataEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageRecord" ADD CONSTRAINT "DataLineageRecord_targetAssetId_fkey" FOREIGN KEY ("targetAssetId") REFERENCES "AIAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageRecord" ADD CONSTRAINT "DataLineageRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataGovernancePolicy" ADD CONSTRAINT "DataGovernancePolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataGovernancePolicy" ADD CONSTRAINT "DataGovernancePolicy_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

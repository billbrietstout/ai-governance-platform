-- CreateTable
CREATE TABLE "RegulationDiscovery" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT,
    "inputs" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulationDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegulationDiscovery_orgId_idx" ON "RegulationDiscovery"("orgId");

-- CreateIndex
CREATE INDEX "RegulationDiscovery_orgId_createdAt_idx" ON "RegulationDiscovery"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "RegulationDiscovery" ADD CONSTRAINT "RegulationDiscovery_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationDiscovery" ADD CONSTRAINT "RegulationDiscovery_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationDiscovery" ADD CONSTRAINT "RegulationDiscovery_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

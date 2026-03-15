-- CreateTable
CREATE TABLE "ComplianceSnapshot" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "snapshotType" TEXT NOT NULL,
    "frameworkCode" TEXT,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "layerScores" JSONB NOT NULL,
    "assetCount" INTEGER NOT NULL,
    "controlsCompliant" INTEGER NOT NULL,
    "controlsTotal" INTEGER NOT NULL,
    "gapCount" INTEGER NOT NULL,
    "evidenceCompleteness" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ComplianceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceSnapshot_orgId_idx" ON "ComplianceSnapshot"("orgId");

-- CreateIndex
CREATE INDEX "ComplianceSnapshot_orgId_createdAt_idx" ON "ComplianceSnapshot"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "ComplianceSnapshot" ADD CONSTRAINT "ComplianceSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceSnapshot" ADD CONSTRAINT "ComplianceSnapshot_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

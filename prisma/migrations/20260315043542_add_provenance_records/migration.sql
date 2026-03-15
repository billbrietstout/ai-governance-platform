-- CreateTable
CREATE TABLE "ProvenanceRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "description" TEXT,
    "responsibleParty" TEXT,
    "attestation" BOOLEAN NOT NULL DEFAULT false,
    "attestationDetails" TEXT,
    "occurredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProvenanceRecord_orgId_idx" ON "ProvenanceRecord"("orgId");

-- CreateIndex
CREATE INDEX "ProvenanceRecord_vendorId_idx" ON "ProvenanceRecord"("vendorId");

-- AddForeignKey
ALTER TABLE "ProvenanceRecord" ADD CONSTRAINT "ProvenanceRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceRecord" ADD CONSTRAINT "ProvenanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAssurance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

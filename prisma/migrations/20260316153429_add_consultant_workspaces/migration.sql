-- CreateTable
CREATE TABLE "ConsultantWorkspace" (
    "id" TEXT NOT NULL,
    "consultantOrgId" TEXT NOT NULL,
    "clientOrgId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultantWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultantWorkspace_consultantOrgId_idx" ON "ConsultantWorkspace"("consultantOrgId");

-- CreateIndex
CREATE INDEX "ConsultantWorkspace_clientOrgId_idx" ON "ConsultantWorkspace"("clientOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantWorkspace_consultantOrgId_clientOrgId_key" ON "ConsultantWorkspace"("consultantOrgId", "clientOrgId");

-- AddForeignKey
ALTER TABLE "ConsultantWorkspace" ADD CONSTRAINT "ConsultantWorkspace_consultantOrgId_fkey" FOREIGN KEY ("consultantOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantWorkspace" ADD CONSTRAINT "ConsultantWorkspace_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

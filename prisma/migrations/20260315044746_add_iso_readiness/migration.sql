-- CreateTable
CREATE TABLE "ISOReadiness" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "ISOReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ISOReadiness_orgId_idx" ON "ISOReadiness"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ISOReadiness_orgId_clauseId_key" ON "ISOReadiness"("orgId", "clauseId");

-- AddForeignKey
ALTER TABLE "ISOReadiness" ADD CONSTRAINT "ISOReadiness_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "maturityLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Organization" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MaturityAssessment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "maturityLevel" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaturityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaturityAssessment_orgId_idx" ON "MaturityAssessment"("orgId");
CREATE INDEX "MaturityAssessment_orgId_createdAt_idx" ON "MaturityAssessment"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "MaturityAssessment" ADD CONSTRAINT "MaturityAssessment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaturityAssessment" ADD CONSTRAINT "MaturityAssessment_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

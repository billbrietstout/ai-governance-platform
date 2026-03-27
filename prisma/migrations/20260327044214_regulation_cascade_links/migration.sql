-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "layerImpactSummary" TEXT,
ADD COLUMN     "parentControlId" TEXT;

-- CreateTable
CREATE TABLE "VraRegulationLink" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "riskArea" TEXT NOT NULL,
    "frameworkCode" "FrameworkCode" NOT NULL,
    "controlId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VraRegulationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VraRegulationLink_frameworkCode_idx" ON "VraRegulationLink"("frameworkCode");

-- CreateIndex
CREATE INDEX "VraRegulationLink_controlId_idx" ON "VraRegulationLink"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "VraRegulationLink_questionId_frameworkCode_key" ON "VraRegulationLink"("questionId", "frameworkCode");

-- CreateIndex
CREATE INDEX "Control_parentControlId_idx" ON "Control"("parentControlId");

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_parentControlId_fkey" FOREIGN KEY ("parentControlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VraRegulationLink" ADD CONSTRAINT "VraRegulationLink_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

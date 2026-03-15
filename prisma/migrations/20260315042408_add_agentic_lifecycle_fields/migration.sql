-- AlterTable
ALTER TABLE "AIAsset" ADD COLUMN     "humanOversightRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifecycleStage" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
ADD COLUMN     "lifecycleUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lifecycleUpdatedBy" TEXT,
ADD COLUMN     "overrideTier" TEXT,
ADD COLUMN     "oversightPolicy" TEXT,
ADD COLUMN     "toolAuthorizations" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "AssetLifecycleTransition" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "userId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLifecycleTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetLifecycleTransition_assetId_idx" ON "AssetLifecycleTransition"("assetId");

-- CreateIndex
CREATE INDEX "AIAsset_orgId_lifecycleStage_idx" ON "AIAsset"("orgId", "lifecycleStage");

-- AddForeignKey
ALTER TABLE "AssetLifecycleTransition" ADD CONSTRAINT "AssetLifecycleTransition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

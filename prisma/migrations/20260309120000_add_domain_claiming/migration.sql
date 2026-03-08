-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "claimedDomain" TEXT,
ADD COLUMN "autoJoinRole" "UserRole" NOT NULL DEFAULT 'VIEWER';

-- CreateIndex
CREATE UNIQUE INDEX "Organization_claimedDomain_key" ON "Organization"("claimedDomain");

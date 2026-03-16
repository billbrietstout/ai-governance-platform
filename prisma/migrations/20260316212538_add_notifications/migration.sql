-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigestDay" TEXT NOT NULL DEFAULT 'MONDAY',
    "weeklyDigestTime" TEXT NOT NULL DEFAULT '08:00',
    "complianceDropAlert" BOOLEAN NOT NULL DEFAULT true,
    "complianceDropThreshold" INTEGER NOT NULL DEFAULT 10,
    "newCriticalRiskAlert" BOOLEAN NOT NULL DEFAULT true,
    "regulatoryDeadline90" BOOLEAN NOT NULL DEFAULT true,
    "regulatoryDeadline30" BOOLEAN NOT NULL DEFAULT true,
    "regulatoryDeadline7" BOOLEAN NOT NULL DEFAULT true,
    "vendorEvidenceExpiry" BOOLEAN NOT NULL DEFAULT true,
    "evidenceExpiryDays" INTEGER NOT NULL DEFAULT 30,
    "shadowAiDetected" BOOLEAN NOT NULL DEFAULT true,
    "newUnownedHighRisk" BOOLEAN NOT NULL DEFAULT true,
    "failedScanAlert" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slackWebhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "metadata" JSONB,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_orgId_idx" ON "NotificationPreference"("orgId");

-- CreateIndex
CREATE INDEX "NotificationLog_orgId_idx" ON "NotificationLog"("orgId");

-- CreateIndex
CREATE INDEX "NotificationLog_orgId_sentAt_idx" ON "NotificationLog"("orgId", "sentAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

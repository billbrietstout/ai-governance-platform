-- Add org-level email kill switch
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "slackWebhookUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "slackEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add per-user notification preferences
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP(3);

-- Add per-alert-type preferences (stored as JSON on user)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "alertPreferences" JSONB NOT NULL DEFAULT '{
  "complianceScoreDrop": true,
  "newCriticalRisk": true,
  "newUnownedSystem": true,
  "deadline90Days": true,
  "deadline30Days": true,
  "deadline7Days": true,
  "vendorEvidenceExpiring": true,
  "shadowAiDetected": true,
  "failedSecurityScan": false
}';

-- Index for fast unsubscribe token lookup
CREATE UNIQUE INDEX IF NOT EXISTS "User_unsubscribeToken_key" ON "User"("unsubscribeToken");

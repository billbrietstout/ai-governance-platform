-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'ATTEST', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'SET_FEATURE_FLAG', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "FeatureFlagName" AS ENUM ('MODULE_SHADOW_AI', 'MODULE_OPS_INTEL', 'MODULE_AGENTIC', 'MODULE_THREAT_IR', 'MODULE_ROI', 'VERTICAL_HEALTHCARE', 'VERTICAL_FINANCIAL', 'VERTICAL_AUTOMOTIVE');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'TEAM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "VerticalMarket" AS ENUM ('GENERAL', 'HEALTHCARE', 'FINANCIAL', 'AUTOMOTIVE', 'RETAIL', 'MANUFACTURING', 'PUBLIC_SECTOR');

-- CreateEnum
CREATE TYPE "DataResidency" AS ENUM ('EU', 'US', 'GLOBAL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('MODEL', 'PROMPT', 'AGENT', 'DATASET', 'APPLICATION', 'TOOL', 'PIPELINE');

-- CreateEnum
CREATE TYPE "EuRiskLevel" AS ENUM ('MINIMAL', 'LIMITED', 'HIGH', 'UNACCEPTABLE');

-- CreateEnum
CREATE TYPE "OperatingModel" AS ENUM ('IN_HOUSE', 'VENDOR', 'HYBRID');

-- CreateEnum
CREATE TYPE "CosaiLayer" AS ENUM ('LAYER_1_BUSINESS', 'LAYER_2_INFORMATION', 'LAYER_3_APPLICATION', 'LAYER_4_PLATFORM', 'LAYER_5_SUPPLY_CHAIN');

-- CreateEnum
CREATE TYPE "AutonomyLevel" AS ENUM ('HUMAN_ONLY', 'ASSISTED', 'SEMI_AUTONOMOUS', 'AUTONOMOUS');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FrameworkCode" AS ENUM ('NIST_AI_RMF', 'EU_AI_ACT', 'ISO_42001', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AttestationStatus" AS ENUM ('PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('IDENTIFIED', 'ASSESSING', 'MITIGATING', 'ACCEPTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('MODEL_CARD', 'DATA_CARD', 'APP_CARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CardSource" AS ENUM ('REPO', 'MANUAL', 'API', 'IMPORT');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('SBOM', 'VULN', 'SECRETS', 'POLICY', 'LICENSE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('MODEL_PROVIDER', 'DATA_PROVIDER', 'INFRASTRUCTURE', 'TOOLING', 'OTHER');

-- CreateEnum
CREATE TYPE "Soc2Status" AS ENUM ('NOT_APPLICABLE', 'IN_PROGRESS', 'CERTIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Iso27001Status" AS ENUM ('NOT_APPLICABLE', 'IN_PROGRESS', 'CERTIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SlsaLevel" AS ENUM ('L0', 'L1', 'L2', 'L3', 'L4');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "verticalMarket" "VerticalMarket" NOT NULL DEFAULT 'GENERAL',
    "dataResidency" "DataResidency" DEFAULT 'GLOBAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lockedUntil" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "prevState" JSONB,
    "nextState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" "FeatureFlagName" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "setBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAsset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assetType" "AssetType" NOT NULL,
    "euRiskLevel" "EuRiskLevel",
    "operatingModel" "OperatingModel",
    "cosaiLayer" "CosaiLayer",
    "autonomyLevel" "AutonomyLevel",
    "verticalMarket" "VerticalMarket",
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountabilityAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "cosaiLayer" "CosaiLayer" NOT NULL,
    "accountableParty" TEXT NOT NULL,
    "responsibleParty" TEXT NOT NULL,
    "supportingParties" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountabilityAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFramework" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" "FrameworkCode" NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "verticalApplicability" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cosaiLayer" "CosaiLayer",
    "personaAccountable" TEXT,
    "operatingModelApplicability" JSONB,
    "verticalApplicability" JSONB,
    "evidenceGuidance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlAttestation" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" "AttestationStatus" NOT NULL DEFAULT 'PENDING',
    "attestedBy" TEXT,
    "attestedAt" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "evidenceRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlAttestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRegister" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "likelihood" INTEGER,
    "impact" INTEGER,
    "riskScore" DOUBLE PRECISION,
    "residualScore" DOUBLE PRECISION,
    "owner" TEXT,
    "cosaiLayer" "CosaiLayer",
    "status" "RiskStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactCard" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "sourceRepo" TEXT,
    "sourceFormat" "CardSource",
    "rawContent" JSONB,
    "normalizedContent" JSONB,
    "contentHash" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ArtifactCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssurance" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorType" "VendorType",
    "cosaiLayer" "CosaiLayer",
    "soc2Status" "Soc2Status",
    "soc2ExpiresAt" TIMESTAMP(3),
    "iso27001Status" "Iso27001Status",
    "slsaLevel" "SlsaLevel",
    "modelCardAvailable" BOOLEAN NOT NULL DEFAULT false,
    "contractAligned" BOOLEAN NOT NULL DEFAULT false,
    "evidenceLinks" JSONB,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAssurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "scannerName" TEXT NOT NULL,
    "scannerVersion" TEXT,
    "scanType" "ScanType" NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "criticalFindings" INTEGER NOT NULL DEFAULT 0,
    "findings" JSONB,
    "policyPassed" BOOLEAN,
    "triggeredBy" TEXT,

    CONSTRAINT "ScanRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "User_orgId_email_key" ON "User"("orgId", "email");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_resourceType_resourceId_idx" ON "AuditLog"("orgId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "FeatureFlag_orgId_idx" ON "FeatureFlag"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_orgId_name_key" ON "FeatureFlag"("orgId", "name");

-- CreateIndex
CREATE INDEX "AIAsset_orgId_idx" ON "AIAsset"("orgId");

-- CreateIndex
CREATE INDEX "AIAsset_orgId_status_idx" ON "AIAsset"("orgId", "status");

-- CreateIndex
CREATE INDEX "AIAsset_ownerId_idx" ON "AIAsset"("ownerId");

-- CreateIndex
CREATE INDEX "AccountabilityAssignment_assetId_idx" ON "AccountabilityAssignment"("assetId");

-- CreateIndex
CREATE INDEX "AccountabilityAssignment_assetId_cosaiLayer_idx" ON "AccountabilityAssignment"("assetId", "cosaiLayer");

-- CreateIndex
CREATE INDEX "AccountabilityAssignment_cosaiLayer_idx" ON "AccountabilityAssignment"("cosaiLayer");

-- CreateIndex
CREATE UNIQUE INDEX "AccountabilityAssignment_assetId_componentName_cosaiLayer_key" ON "AccountabilityAssignment"("assetId", "componentName", "cosaiLayer");

-- CreateIndex
CREATE INDEX "ComplianceFramework_orgId_idx" ON "ComplianceFramework"("orgId");

-- CreateIndex
CREATE INDEX "Control_frameworkId_idx" ON "Control"("frameworkId");

-- CreateIndex
CREATE INDEX "Control_cosaiLayer_idx" ON "Control"("cosaiLayer");

-- CreateIndex
CREATE UNIQUE INDEX "Control_frameworkId_controlId_key" ON "Control"("frameworkId", "controlId");

-- CreateIndex
CREATE INDEX "ControlAttestation_controlId_idx" ON "ControlAttestation"("controlId");

-- CreateIndex
CREATE INDEX "ControlAttestation_assetId_idx" ON "ControlAttestation"("assetId");

-- CreateIndex
CREATE INDEX "ControlAttestation_assetId_status_idx" ON "ControlAttestation"("assetId", "status");

-- CreateIndex
CREATE INDEX "RiskRegister_orgId_idx" ON "RiskRegister"("orgId");

-- CreateIndex
CREATE INDEX "RiskRegister_orgId_status_idx" ON "RiskRegister"("orgId", "status");

-- CreateIndex
CREATE INDEX "RiskRegister_assetId_idx" ON "RiskRegister"("assetId");

-- CreateIndex
CREATE INDEX "ArtifactCard_orgId_idx" ON "ArtifactCard"("orgId");

-- CreateIndex
CREATE INDEX "ArtifactCard_assetId_idx" ON "ArtifactCard"("assetId");

-- CreateIndex
CREATE INDEX "VendorAssurance_orgId_idx" ON "VendorAssurance"("orgId");

-- CreateIndex
CREATE INDEX "ScanRecord_orgId_idx" ON "ScanRecord"("orgId");

-- CreateIndex
CREATE INDEX "ScanRecord_assetId_idx" ON "ScanRecord"("assetId");

-- CreateIndex
CREATE INDEX "ScanRecord_assetId_scanType_completedAt_idx" ON "ScanRecord"("assetId", "scanType", "completedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAsset" ADD CONSTRAINT "AIAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAsset" ADD CONSTRAINT "AIAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountabilityAssignment" ADD CONSTRAINT "AccountabilityAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceFramework" ADD CONSTRAINT "ComplianceFramework_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlAttestation" ADD CONSTRAINT "ControlAttestation_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlAttestation" ADD CONSTRAINT "ControlAttestation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlAttestation" ADD CONSTRAINT "ControlAttestation_attestedBy_fkey" FOREIGN KEY ("attestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactCard" ADD CONSTRAINT "ArtifactCard_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactCard" ADD CONSTRAINT "ArtifactCard_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssurance" ADD CONSTRAINT "VendorAssurance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecord" ADD CONSTRAINT "ScanRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AIAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

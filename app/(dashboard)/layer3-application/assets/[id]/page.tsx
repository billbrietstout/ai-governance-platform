/**
 * Asset detail – tabs: Overview, Accountability, Compliance, Risk, Card, Scanning, Audit Trail.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EURiskBadge } from "@/components/assets/EURiskBadge";
import { AutonomyBadge } from "@/components/assets/AutonomyBadge";
import { OperatingModelBadge } from "@/components/assets/OperatingModelBadge";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { AccountabilityMatrix } from "@/components/assets/AccountabilityMatrix";
import { AssetTimeline } from "@/components/assets/AssetTimeline";
import { prisma } from "@/lib/prisma";
import { queryAuditLog, type AuditTransactionClient } from "@/lib/audit";
import { AssetDetailTabs } from "./AssetDetailTabs";

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();
  const [assetRes, complianceRes, accountabilityRes, riskRes, cardsRes, scanRes] =
    await Promise.all([
      caller.assets.get({ id }),
      caller.compliance.getComplianceScore({ assetId: id }),
      caller.accountability.getAccountabilityMatrix({ assetId: id }),
      caller.risk.getRiskRegister({ assetId: id }),
      caller.supplyChain.getCards({ assetId: id }),
      caller.supplyChain.getScanCompliance({ assetId: id })
    ]);

  if (!assetRes.data) notFound();
  const asset = assetRes.data;

  const auditEntries = await queryAuditLog({
    orgId: asset.orgId,
    resourceType: "AIAsset",
    resourceId: id,
    pageSize: 20,
    tx: prisma as unknown as AuditTransactionClient
  });

  const auditEvents = auditEntries.entries.map((e) => ({
    id: e.id,
    action: e.action,
    at: e.createdAt,
    by: undefined
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer3-application/assets" className="text-navy-400 text-sm hover:underline">
          ← Asset Inventory
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{asset.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <EURiskBadge level={asset.euRiskLevel} />
          <AutonomyBadge level={asset.autonomyLevel} />
          <OperatingModelBadge model={asset.operatingModel} />
          <span className="text-sm text-gray-600">{asset.status}</span>
          <ComplianceRing percentage={complianceRes.data.percentage} size={36} />
        </div>
      </div>

      <AssetDetailTabs
        asset={asset}
        compliance={complianceRes.data}
        accountability={{
          assignments: accountabilityRes.data.assignments.map((a) => ({
            ...a,
            supportingParties: Array.isArray(a.supportingParties)
              ? (a.supportingParties as string[])
              : undefined
          }))
        }}
        risks={riskRes.data}
        cards={cardsRes.data}
        scanCompliance={scanRes.data}
        auditEvents={auditEvents}
        layers={COSAI_LAYERS}
      />
    </main>
  );
}

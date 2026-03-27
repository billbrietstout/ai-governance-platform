/**
 * Resolve audit log resource IDs and actor IDs to human-readable labels for display.
 */
import type { AuditLog, PrismaClient } from "@prisma/client";

function labelFromJson(state: unknown): string | null {
  if (state == null || typeof state !== "object") return null;
  const o = state as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return (
    pick(o.name) ??
    pick(o.title) ??
    pick(o.email) ??
    pick(o.clientName) ??
    pick(o.vendorName) ??
    pick(o.label) ??
    (typeof o.flag === "string" ? o.flag.trim() || null : null) ??
    null
  );
}

export type AuditFeedRow = AuditLog & {
  actorEmail: string | null;
  resourceLabel: string;
};

export async function enrichAuditFeedForDisplay(
  prisma: PrismaClient,
  orgId: string,
  entries: AuditLog[]
): Promise<AuditFeedRow[]> {
  if (entries.length === 0) return [];

  const userIds = [...new Set(entries.map((e) => e.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true }
  });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  const byType = new Map<string, string[]>();
  for (const e of entries) {
    const fromJson =
      labelFromJson(e.nextState) ?? labelFromJson(e.prevState);
    if (fromJson) continue;
    const list = byType.get(e.resourceType) ?? [];
    list.push(e.resourceId);
    byType.set(e.resourceType, list);
  }

  const assetIds = [...new Set(byType.get("AIAsset") ?? [])];
  const orgIds = [...new Set(byType.get("Organization") ?? [])];
  const userResourceIds = [...new Set(byType.get("User") ?? [])];
  const riskIds = [...new Set(byType.get("RiskRegister") ?? [])];
  const assessmentIds = [...new Set(byType.get("Assessment") ?? [])];
  const workspaceIds = [...new Set(byType.get("ConsultantWorkspace") ?? [])];
  const attestationIds = [...new Set(byType.get("ControlAttestation") ?? [])];
  const assignmentIds = [...new Set(byType.get("AccountabilityAssignment") ?? [])];

  const [assets, orgs, userResources, risks, assessments, workspaces, attestations, assignments] =
    await Promise.all([
      assetIds.length
        ? prisma.aIAsset.findMany({
            where: { id: { in: assetIds }, orgId },
            select: { id: true, name: true }
          })
        : [],
      orgIds.length
        ? prisma.organization.findMany({
            where: { id: { in: orgIds } },
            select: { id: true, name: true }
          })
        : [],
      userResourceIds.length
        ? prisma.user.findMany({
            where: { id: { in: userResourceIds } },
            select: { id: true, email: true }
          })
        : [],
      riskIds.length
        ? prisma.riskRegister.findMany({
            where: { id: { in: riskIds }, orgId },
            select: { id: true, title: true }
          })
        : [],
      assessmentIds.length
        ? prisma.assessment.findMany({
            where: { id: { in: assessmentIds }, orgId },
            select: { id: true, name: true }
          })
        : [],
      workspaceIds.length
        ? prisma.consultantWorkspace.findMany({
            where: {
              id: { in: workspaceIds },
              OR: [{ consultantOrgId: orgId }, { clientOrgId: orgId }]
            },
            select: { id: true, clientName: true }
          })
        : [],
      attestationIds.length
        ? prisma.controlAttestation.findMany({
            where: {
              id: { in: attestationIds },
              asset: { orgId }
            },
            select: {
              id: true,
              control: { select: { controlId: true, title: true } },
              asset: { select: { name: true } }
            }
          })
        : [],
      assignmentIds.length
        ? prisma.accountabilityAssignment.findMany({
            where: {
              id: { in: assignmentIds },
              asset: { orgId }
            },
            select: {
              id: true,
              componentName: true,
              asset: { select: { name: true } }
            }
          })
        : []
    ]);

  const assetName = new Map(assets.map((a) => [a.id, a.name]));
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const userEmail = new Map(userResources.map((u) => [u.id, u.email]));
  const riskTitle = new Map(risks.map((r) => [r.id, r.title]));
  const assessmentName = new Map(assessments.map((a) => [a.id, a.name]));
  const workspaceClient = new Map(workspaces.map((w) => [w.id, w.clientName]));
  const attestationLabel = new Map(
    attestations.map((a) => [
      a.id,
      `${a.control.controlId} · ${a.asset.name}${a.control.title ? ` (${a.control.title})` : ""}`
    ])
  );
  const assignmentById = new Map(
    assignments.map((a) => [a.id, `${a.asset.name}: ${a.componentName}`])
  );

  function resolveLabel(e: AuditLog): string {
    const fromJson = labelFromJson(e.nextState) ?? labelFromJson(e.prevState);
    if (fromJson) return fromJson;

    switch (e.resourceType) {
      case "AIAsset":
        return assetName.get(e.resourceId) ?? e.resourceId;
      case "Organization":
        return orgName.get(e.resourceId) ?? e.resourceId;
      case "User":
        return userEmail.get(e.resourceId) ?? e.resourceId;
      case "RiskRegister":
        return riskTitle.get(e.resourceId) ?? e.resourceId;
      case "Assessment":
        return assessmentName.get(e.resourceId) ?? e.resourceId;
      case "ConsultantWorkspace":
        return workspaceClient.get(e.resourceId) ?? e.resourceId;
      case "ControlAttestation":
        return attestationLabel.get(e.resourceId) ?? e.resourceId;
      case "AccountabilityAssignment":
        return assignmentById.get(e.resourceId) ?? e.resourceId;
      case "FeatureFlag":
        if (e.nextState && typeof e.nextState === "object") {
          const n = e.nextState as Record<string, unknown>;
          if (typeof n.name === "string") return n.name;
        }
        return e.resourceId;
      default:
        return e.resourceId;
    }
  }

  return entries.map((e) => ({
    ...e,
    actorEmail: emailByUserId.get(e.userId) ?? null,
    resourceLabel: resolveLabel(e)
  }));
}

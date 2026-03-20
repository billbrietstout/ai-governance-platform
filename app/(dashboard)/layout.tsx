import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
import { PersonaModal } from "@/components/PersonaModal";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";

const MODULE_FLAGS = [
  "MODULE_SHADOW_AI",
  "MODULE_OPS_INTEL",
  "MODULE_AGENTIC",
  "MODULE_THREAT_IR",
  "MODULE_ROI"
] as const;

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as
    | { email?: string | null; orgId?: string; role?: string }
    | undefined;
  const consultantOrgId = user?.orgId ?? null;
  const userId = (user as { id?: string } | undefined)?.id;

  const workspaceOrgId = (await cookies()).get("workspace-org-id")?.value ?? null;
  let effectiveOrgId = consultantOrgId ?? "";
  let activeWorkspaceOrgId: string | null = null;
  let activeWorkspaceName: string | null = null;

  if (workspaceOrgId && consultantOrgId) {
    const workspace = await prisma.consultantWorkspace.findFirst({
      where: { consultantOrgId, clientOrgId: workspaceOrgId, status: "ACTIVE" },
      select: { clientName: true }
    });
    if (workspace) {
      effectiveOrgId = workspaceOrgId;
      activeWorkspaceOrgId = workspaceOrgId;
      activeWorkspaceName = workspace.clientName;
    }
  }

  let orgName: string | null = null;
  let featureFlags: Record<string, boolean> = {};
  let onboardingComplete = true;
  let persona: string | null = null;
  let personaModalDismissed = false;
  let frameworks: { code: string }[] = [];
  let tier = "FREE";
  let assetCount = 0;
  let consultantWorkspaces: { id: string; clientOrgId: string; clientName: string }[] = [];
  let consultantOrgName: string | null = null;
  let consultantData: string | null = null;
  let isSuperAdmin = false;

  if (effectiveOrgId) {
    const [org, flags, fws, dbUser, assetCnt, consultantTier] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: effectiveOrgId },
        select: { name: true, onboardingComplete: true, onboardingStep: true, tier: true }
      }),
      prisma.featureFlag.findMany({
        where: { orgId: effectiveOrgId },
        select: { name: true, enabled: true }
      }),
      prisma.complianceFramework.findMany({
        where: { orgId: effectiveOrgId, isActive: true },
        select: { code: true }
      }),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { persona: true, personaModalDismissedAt: true, isSuperAdmin: true }
          })
        : Promise.resolve(null),
      prisma.aIAsset.count({ where: { orgId: effectiveOrgId, deletedAt: null } }),
      consultantOrgId
        ? (async () => {
            const o = await prisma.organization.findUnique({
              where: { id: consultantOrgId },
              select: { tier: true }
            });
            return o?.tier === "CONSULTANT" || o?.tier === "ENTERPRISE" ? consultantOrgId : null;
          })()
        : Promise.resolve(null)
    ]);
    consultantData = consultantTier;
    orgName = org?.name ?? null;
    tier = org?.tier ?? "FREE";
    assetCount = assetCnt ?? 0;
    onboardingComplete = org?.onboardingComplete ?? true;
    if ((org?.onboardingStep ?? 0) >= 6 && !onboardingComplete) {
      onboardingComplete = true;
    }
    persona = dbUser?.persona ?? null;
    personaModalDismissed = !!dbUser?.personaModalDismissedAt;
    isSuperAdmin = dbUser?.isSuperAdmin ?? false;
    featureFlags = MODULE_FLAGS.reduce(
      (acc, name) => {
        acc[name] = flags.find((f) => f.name === name)?.enabled ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );
    frameworks = fws;

    if (consultantData) {
      const [workspaces, consultantOrg] = await Promise.all([
        prisma.consultantWorkspace.findMany({
          where: { consultantOrgId: consultantData, status: "ACTIVE" },
          select: { id: true, clientOrgId: true, clientName: true },
          orderBy: { updatedAt: "desc" }
        }),
        prisma.organization.findUnique({
          where: { id: consultantData },
          select: { name: true }
        })
      ]);
      consultantWorkspaces = workspaces;
      consultantOrgName = consultantOrg?.name ?? null;
    }
  }

  if (consultantOrgId && effectiveOrgId === consultantOrgId && !onboardingComplete) {
    redirect("/onboarding");
  }

  const showPersonaModal = onboardingComplete && !persona && !personaModalDismissed;

  return (
    <>
      <DashboardShell
        persona={persona}
        userEmail={user?.email ?? null}
        orgName={orgName}
        featureFlags={featureFlags}
        frameworks={frameworks}
        tier={tier}
        assetCount={assetCount}
        role={user?.role ?? null}
        consultantOrgId={consultantData ?? null}
        consultantWorkspaces={consultantWorkspaces}
        consultantOrgName={consultantOrgName}
        activeWorkspaceOrgId={activeWorkspaceOrgId}
        activeWorkspaceName={activeWorkspaceName}
        isSuperAdmin={isSuperAdmin}
      >
        {children}
      </DashboardShell>
      {showPersonaModal && <PersonaModal />}
    </>
  );
}

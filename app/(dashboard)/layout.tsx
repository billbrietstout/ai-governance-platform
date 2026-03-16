import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
  const user = session?.user as { email?: string | null; orgId?: string } | undefined;
  const orgId = user?.orgId;

  let orgName: string | null = null;
  let featureFlags: Record<string, boolean> = {};
  let onboardingComplete = true;
  let persona: string | null = null;
  let personaModalDismissed = false;

  const userId = (user as { id?: string } | undefined)?.id;

  let frameworks: { code: string }[] = [];
  let tier = "FREE";
  let assetCount = 0;
  if (orgId) {
    const [org, flags, fws, dbUser, assetCnt] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, onboardingComplete: true, onboardingStep: true, tier: true }
      }),
      prisma.featureFlag.findMany({
        where: { orgId },
        select: { name: true, enabled: true }
      }),
      prisma.complianceFramework.findMany({
        where: { orgId, isActive: true },
        select: { code: true }
      }),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { persona: true, personaModalDismissedAt: true }
          })
        : Promise.resolve(null),
      prisma.aIAsset.count({ where: { orgId, deletedAt: null } })
    ]);
    orgName = org?.name ?? null;
    tier = org?.tier ?? "FREE";
    assetCount = assetCnt ?? 0;
    onboardingComplete = org?.onboardingComplete ?? true;
    if ((org?.onboardingStep ?? 0) >= 6 && !onboardingComplete) {
      onboardingComplete = true;
    }
    persona = dbUser?.persona ?? null;
    personaModalDismissed = !!dbUser?.personaModalDismissedAt;
    featureFlags = MODULE_FLAGS.reduce(
      (acc, name) => {
        acc[name] = flags.find((f) => f.name === name)?.enabled ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );
    frameworks = fws;
  }

  if (orgId && !onboardingComplete) {
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
      >
        {children}
      </DashboardShell>
      {showPersonaModal && <PersonaModal />}
    </>
  );
}

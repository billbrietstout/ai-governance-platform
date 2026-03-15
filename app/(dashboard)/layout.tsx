import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Sidebar } from "@/components/layout/Sidebar";
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

  let frameworks: { code: string }[] = [];
  if (orgId) {
    const [org, flags, fws] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, onboardingComplete: true }
      }),
      prisma.featureFlag.findMany({
        where: { orgId },
        select: { name: true, enabled: true }
      }),
      prisma.complianceFramework.findMany({
        where: { orgId, isActive: true },
        select: { code: true }
      })
    ]);
    orgName = org?.name ?? null;
    onboardingComplete = org?.onboardingComplete ?? true;
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

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        userEmail={user?.email ?? null}
        orgName={orgName}
        featureFlags={featureFlags}
        frameworks={frameworks}
      />
      <main className="dashboard-content flex-1 overflow-auto bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          <div className="page-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

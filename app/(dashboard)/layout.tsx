import { auth } from "@/auth";
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

  if (orgId) {
    const [org, flags] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true }
      }),
      prisma.featureFlag.findMany({
        where: { orgId },
        select: { name: true, enabled: true }
      })
    ]);
    orgName = org?.name ?? null;
    featureFlags = MODULE_FLAGS.reduce(
      (acc, name) => {
        acc[name] = flags.find((f) => f.name === name)?.enabled ?? false;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }

  return (
    <div className="flex min-h-dvh bg-slatePro-950">
      <Sidebar
        userEmail={user?.email ?? null}
        orgName={orgName}
        featureFlags={featureFlags}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

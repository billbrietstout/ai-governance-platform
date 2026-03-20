/**
 * Create new client workspace – CONSULTANT tier only.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConsultantFeatureTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { CreateWorkspaceForm } from "../CreateWorkspaceForm";

export default async function ConsultantNewPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  if (!user?.orgId) {
    redirect("/login");
  }

  const orgTier = await getConsultantFeatureTier();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          New Client Workspace
        </h1>
        <p className="mt-1 text-slate-600">
          Create a new client organization and assessment workspace.
        </p>
      </div>

      <UpgradeGate
        feature="Client Workspaces"
        requiredTier="CONSULTANT"
        description="Create and manage client workspaces for multi-tenant assessments"
        unlockedBy={[
          "Create client workspaces",
          "Switch between client contexts",
          "Track maturity and compliance per client"
        ]}
        orgTier={orgTier}
      >
        <CreateWorkspaceForm />
      </UpgradeGate>
    </main>
  );
}

/**
 * Client Workspaces – CONSULTANT tier only.
 */
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getConsultantFeatureTier } from "@/lib/tiers/check-tier";
import { tierMeets } from "@/lib/tiers/tier-utils";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { ConsultantWorkspaceList } from "./ConsultantWorkspaceList";

export default async function ConsultantPage() {
  const orgTier = await getConsultantFeatureTier();
  const caller = await createServerCaller();
  const workspaces = tierMeets(orgTier, "CONSULTANT")
    ? await caller.consultant.getWorkspaces()
    : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Client Workspaces</h1>
        <p className="mt-1 text-slate-600">
          Manage multiple client AI assessments from a single consultant dashboard.
        </p>
      </div>

      <UpgradeGate
        feature="Client Workspaces"
        requiredTier="CONSULTANT"
        description="Manage multiple client AI assessments from a single consultant dashboard"
        unlockedBy={[
          "Create and manage client workspaces",
          "Switch between client contexts",
          "Track maturity and compliance per client"
        ]}
        orgTier={orgTier}
      >
        <ConsultantWorkspaceList workspaces={workspaces} />
      </UpgradeGate>
    </main>
  );
}

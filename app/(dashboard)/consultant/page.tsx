/**
 * My Client Workspaces – CONSULTANT tier only.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getConsultantFeatureTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { ConsultantWorkspaceGrid } from "./ConsultantWorkspaceGrid";

export default async function ConsultantPage() {
  const orgTier = await getConsultantFeatureTier();
  const caller = await createServerCaller();
  const workspaces = await caller.consultant.getWorkspaces();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
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
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Client Workspaces</h1>
              <p className="mt-1 text-slate-600">
                Manage and access your client assessments in one place.
              </p>
            </div>
            <Link
              href="/consultant/new"
              className="inline-flex items-center rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-500"
            >
              New client workspace
            </Link>
          </div>
          <ConsultantWorkspaceGrid workspaces={workspaces} />
        </>
      </UpgradeGate>
    </main>
  );
}

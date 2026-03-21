/**
 * Regulation Discovery Wizard – works for both guests (steps 1–3 no auth) and authenticated users.
 */
import { auth } from "@/auth";
import { DiscoveryWizardClient } from "./DiscoveryWizardClient";
import { runDiscovery } from "./actions";

export default async function DiscoveryWizardPage() {
  const session = await auth();
  const isGuest = !session?.user;

  let defaultVerticals: string[] = [];
  let defaultOperatingModel: string | null = null;

  if (!isGuest) {
    try {
      const { createServerCaller } = await import("@/lib/trpc/server-caller");
      const caller = await createServerCaller();
      const orgRes = await caller.discovery.getOrgContext();
      defaultVerticals = orgRes.data.clientVerticals?.length
        ? orgRes.data.clientVerticals
        : ["GENERAL"];
      defaultOperatingModel = orgRes.data.operatingModel ?? "MIXED";
    } catch {
      // Use defaults when org context unavailable
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Regulation Discovery Wizard
        </h1>
        <p className="mt-1 text-slate-600">
          Answer a few questions to identify which regulations apply to your planned AI system.
          {isGuest && " No login required for the first 3 steps."}
        </p>
      </div>

      <DiscoveryWizardClient
        defaultVerticals={defaultVerticals}
        defaultOperatingModel={defaultOperatingModel}
        isGuest={isGuest}
        runDiscoveryAuthenticated={
          isGuest
            ? undefined
            : async (inputs) => {
                return runDiscovery({
                  assetType: inputs.assetType as "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE",
                  description: inputs.description,
                  businessFunction: inputs.businessFunction as
                    | "HR"
                    | "Finance"
                    | "Operations"
                    | "Customer Service"
                    | "Healthcare"
                    | "Legal"
                    | "Other",
                  decisionsAffectingPeople: inputs.decisionsAffectingPeople,
                  interactsWithEndUsers: inputs.interactsWithEndUsers,
                  deployment: inputs.deployment as
                    | "EU_market"
                    | "US_only"
                    | "Global"
                    | "Internal_only",
                  verticals: inputs.verticals,
                  operatingModel: inputs.operatingModel,
                  autonomyLevel: inputs.autonomyLevel as "L0" | "L1" | "L2" | "L3" | "L4" | "L5",
                  dataTypes: inputs.dataTypes,
                  euResidentsData: inputs.euResidentsData as "Yes" | "No" | "Unknown",
                  expectedRiskLevel: inputs.expectedRiskLevel as
                    | "Low"
                    | "Medium"
                    | "High"
                    | "Critical",
                  vulnerablePopulations: inputs.vulnerablePopulations,
                  euEntityType: inputs.euEntityType,
                  euEstablishedInEU: inputs.euEstablishedInEU,
                  euExclusion: inputs.euExclusion as
                    | "military"
                    | "rd_only"
                    | "open_source"
                    | "personal_use"
                    | undefined,
                  euTransparencyTypes: inputs.euTransparencyTypes as
                    | ("deep_fake" | "synthetic_content" | "emotion_biometric" | "natural_person")[]
                    | undefined
                });
              }
        }
      />
    </main>
  );
}

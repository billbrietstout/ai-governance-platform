"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function runDiscovery(inputs: {
  assetType: "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE";
  description?: string;
  businessFunction:
    | "HR"
    | "Finance"
    | "Operations"
    | "Customer Service"
    | "Healthcare"
    | "Legal"
    | "Other";
  decisionsAffectingPeople: boolean;
  interactsWithEndUsers: boolean;
  deployment: "EU_market" | "US_only" | "Global" | "Internal_only";
  verticals: string[];
  operatingModel?: string;
  autonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
  dataTypes: string[];
  euResidentsData: "Yes" | "No" | "Unknown";
  expectedRiskLevel: "Low" | "Medium" | "High" | "Critical";
  vulnerablePopulations: boolean;
  euEntityType?: string;
  euEstablishedInEU?: boolean;
  euExclusion?: "military" | "rd_only" | "open_source" | "personal_use";
  euTransparencyTypes?: ("deep_fake" | "synthetic_content" | "emotion_biometric" | "natural_person")[];
}) {
  const caller = await createServerCaller();
  const result = await caller.discovery.runDiscovery({ inputs });
  return result.data.id;
}

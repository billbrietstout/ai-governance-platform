/**
 * Manual card entry – structured form fallback for any provider.
 */
import type { NormalizedCard } from "../normalizer";

export type ManualCardInput = {
  modelName?: string;
  version?: string;
  organization?: string;
  intendedUse?: string;
  outOfScopeUse?: string;
  trainingData?: string;
  evaluations?: Record<string, string>[];
  ethicsConsiderations?: string;
  biasAnalysis?: string;
  license?: string;
  knownVulnerabilities?: string[];
  limitations?: string[];
  contactInfo?: string;
  lastUpdated?: string;
};

export function buildManualCard(input: ManualCardInput): NormalizedCard {
  return {
    modelName: input.modelName ?? "",
    version: input.version ?? "",
    organization: input.organization ?? "",
    intendedUse: input.intendedUse ?? "",
    outOfScopeUse: input.outOfScopeUse ?? "",
    trainingData: input.trainingData ?? "",
    evaluations: input.evaluations ?? [],
    ethicsConsiderations: input.ethicsConsiderations ?? "",
    biasAnalysis: input.biasAnalysis ?? "",
    license: input.license ?? "",
    knownVulnerabilities: input.knownVulnerabilities ?? [],
    limitations: input.limitations ?? [],
    contactInfo: input.contactInfo ?? "",
    lastUpdated: input.lastUpdated ?? new Date().toISOString()
  };
}

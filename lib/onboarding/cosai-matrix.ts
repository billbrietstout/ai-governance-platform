/**
 * CoSAI shared responsibility matrix – who owns what at each layer by operating model.
 */

export const COSAI_LAYERS = [
  { id: "L1", label: "L1: Business", desc: "Governance, policy, accountability" },
  { id: "L2", label: "L2: Information", desc: "Data, lineage, classification" },
  { id: "L3", label: "L3: Application", desc: "Models, agents, applications" },
  { id: "L4", label: "L4: Platform", desc: "Infra, MLOps, monitoring" },
  { id: "L5", label: "L5: Supply Chain", desc: "Vendors, model cards, provenance" }
] as const;

export type Responsibility = "Customer" | "Provider" | "Shared";

export const COSAI_RESPONSIBILITY_MATRIX: Record<
  string,
  Record<string, Responsibility>
> = {
  IAAS: {
    L1: "Customer",
    L2: "Customer",
    L3: "Customer",
    L4: "Shared",
    L5: "Customer"
  },
  PAAS: {
    L1: "Customer",
    L2: "Customer",
    L3: "Shared",
    L4: "Provider",
    L5: "Shared"
  },
  AGENT_PAAS: {
    L1: "Customer",
    L2: "Customer",
    L3: "Shared",
    L4: "Provider",
    L5: "Shared"
  },
  SAAS: {
    L1: "Customer",
    L2: "Shared",
    L3: "Provider",
    L4: "Provider",
    L5: "Provider"
  },
  MIXED: {
    L1: "Customer",
    L2: "Shared",
    L3: "Shared",
    L4: "Shared",
    L5: "Shared"
  }
};

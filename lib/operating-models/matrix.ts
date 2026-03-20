/**
 * CoSAI 5-layer responsibility matrix by operating model.
 * Customer=blue, Shared=amber, Provider=gray
 */

export type OperatingModelKey = "IAAS" | "PAAS" | "AGENT_PAAS" | "SAAS";

export type LayerRow = {
  layer: string;
  label: string;
  customer: boolean;
  shared: boolean;
  provider: boolean;
};

export type OperatingModelDef = {
  key: OperatingModelKey;
  name: string;
  description: string;
  examples: string[];
  bestFor: string[];
  matrix: LayerRow[];
  customerResponsibilities: string[];
};

export const OPERATING_MODELS: OperatingModelDef[] = [
  {
    key: "IAAS",
    name: "IaaS",
    description:
      "Infrastructure as a Service — you run AI workloads on provider infrastructure. Full control over models, data, and application logic.",
    examples: [
      "AWS EC2 + self-hosted Llama 3",
      "Azure VMs + custom ML stack",
      "GCP Compute + Vertex AI models"
    ],
    bestFor: [
      "Custom model training",
      "Sensitive data that cannot leave your control",
      "Heavy customization",
      "Regulatory isolation"
    ],
    matrix: [
      { layer: "L1", label: "L1 Business", customer: true, shared: false, provider: false },
      { layer: "L2", label: "L2 Information", customer: true, shared: false, provider: false },
      { layer: "L3", label: "L3 Application", customer: true, shared: false, provider: false },
      { layer: "L4", label: "L4 Platform", customer: true, shared: true, provider: true },
      { layer: "L5", label: "L5 Supply Chain", customer: true, shared: true, provider: true }
    ],
    customerResponsibilities: [
      "Define business requirements and risk appetite",
      "Own all data governance, classification, and lineage",
      "Build, deploy, and maintain AI applications",
      "Manage model selection, training, and lifecycle",
      "Ensure compliance with regulations (EU AI Act, etc.)",
      "Manage vendor relationships for infrastructure"
    ]
  },
  {
    key: "PAAS",
    name: "AI-PaaS",
    description:
      "AI Platform as a Service — provider supplies models and APIs; you build applications and manage data.",
    examples: ["Azure OpenAI Service", "Google Vertex AI", "AWS Bedrock", "Anthropic API"],
    bestFor: [
      "Rapid application development",
      "LLM-powered apps",
      "When you need scale without infra management"
    ],
    matrix: [
      { layer: "L1", label: "L1 Business", customer: true, shared: false, provider: false },
      { layer: "L2", label: "L2 Information", customer: true, shared: true, provider: false },
      { layer: "L3", label: "L3 Application", customer: true, shared: true, provider: false },
      { layer: "L4", label: "L4 Platform", customer: false, shared: true, provider: true },
      { layer: "L5", label: "L5 Supply Chain", customer: false, shared: true, provider: true }
    ],
    customerResponsibilities: [
      "Define use cases and business requirements",
      "Own data governance for your data sent to the API",
      "Build and maintain application logic and prompts",
      "Ensure human oversight and appropriate use of model outputs",
      "Assess and document AI risk for your application",
      "Review provider SLAs and compliance certifications"
    ]
  },
  {
    key: "AGENT_PAAS",
    name: "Agent-PaaS",
    description:
      "Agent Platform as a Service — provider supplies agentic AI capabilities; you configure agents and integrate with your systems.",
    examples: [
      "OpenAI Assistants API",
      "Microsoft Copilot Studio",
      "Google Agent Builder",
      "Custom agent frameworks on PaaS"
    ],
    bestFor: [
      "Autonomous workflows",
      "Multi-step reasoning",
      "Agentic assistants",
      "When agents need tool use"
    ],
    matrix: [
      { layer: "L1", label: "L1 Business", customer: true, shared: true, provider: false },
      { layer: "L2", label: "L2 Information", customer: true, shared: true, provider: false },
      { layer: "L3", label: "L3 Application", customer: true, shared: true, provider: false },
      { layer: "L4", label: "L4 Platform", customer: false, shared: true, provider: true },
      { layer: "L5", label: "L5 Supply Chain", customer: false, shared: true, provider: true }
    ],
    customerResponsibilities: [
      "Define agent scope, boundaries, and allowed actions",
      "Own data governance for data accessed by agents",
      "Configure agent tools and integrations securely",
      "Implement kill switches and human-in-the-loop controls",
      "Monitor agent behavior and audit trails",
      "Ensure agentic governance (L3+ autonomy requirements)"
    ]
  },
  {
    key: "SAAS",
    name: "AI-SaaS",
    description:
      "AI Software as a Service — fully managed AI application. Provider owns most of the stack.",
    examples: ["Salesforce Einstein", "HubSpot AI", "Gong", "Grammarly", "ChatGPT Team"],
    bestFor: ["Off-the-shelf AI features", "Minimal customization", "Quick time-to-value"],
    matrix: [
      { layer: "L1", label: "L1 Business", customer: true, shared: true, provider: false },
      { layer: "L2", label: "L2 Information", customer: true, shared: true, provider: false },
      { layer: "L3", label: "L3 Application", customer: false, shared: true, provider: true },
      { layer: "L4", label: "L4 Platform", customer: false, shared: false, provider: true },
      { layer: "L5", label: "L5 Supply Chain", customer: false, shared: false, provider: true }
    ],
    customerResponsibilities: [
      "Define business requirements and use case appropriateness",
      "Own data governance for data you input into the SaaS",
      "Configure the application within provider constraints",
      "Ensure users are trained and use the system appropriately",
      "Review provider compliance (SOC2, GDPR, etc.)",
      "Monitor for drift or changes in provider behavior"
    ]
  }
];

export function getOperatingModel(key: OperatingModelKey): OperatingModelDef | undefined {
  return OPERATING_MODELS.find((m) => m.key === key);
}

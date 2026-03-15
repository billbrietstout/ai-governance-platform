/**
 * Maturity assessment questions by layer and level.
 * M1=Aware, M2=Documented, M3=Implemented, M4=Measured, M5=Optimised
 * Each question has options array: index 0 → score 1, index 1 → score 2, etc.
 */

export type MaturityLayer = "L1" | "L2" | "L3" | "L4" | "L5";

export type MaturityQuestion = {
  id: string;
  layer: MaturityLayer;
  level: number;
  question: string;
  hint: string;
  weight: number;
  options: string[]; // 3-5 strings, position maps to score (index+1)
};

export const MATURITY_QUESTIONS: MaturityQuestion[] = [
  // L1: Business
  {
    id: "L1-1",
    layer: "L1",
    level: 1,
    question: "Do you have a documented AI governance policy?",
    hint: "Policy defines principles, scope, and accountability for AI use",
    weight: 1,
    options: [
      "No policy exists",
      "Informal guidelines only",
      "Formal policy drafted but not approved",
      "Approved policy in use",
      "Policy actively enforced with metrics"
    ]
  },
  {
    id: "L1-2",
    layer: "L1",
    level: 2,
    question: "Have you mapped applicable regulations to your AI systems?",
    hint: "EU AI Act, sector-specific rules, and local laws",
    weight: 1,
    options: [
      "No regulatory mapping",
      "Partial list of regulations identified",
      "Mapping in progress, not complete",
      "Complete mapping with coverage assessment",
      "Mapping maintained and reviewed quarterly"
    ]
  },
  {
    id: "L1-3",
    layer: "L1",
    level: 3,
    question: "Is there executive ownership (e.g. CAIO) for AI governance?",
    hint: "Dedicated C-level or equivalent accountability",
    weight: 1,
    options: [
      "No designated owner",
      "Ad hoc ownership, not formalized",
      "Owner identified but role not fully defined",
      "Formal CAIO or equivalent role in place",
      "Executive ownership with board reporting"
    ]
  },
  {
    id: "L1-4",
    layer: "L1",
    level: 4,
    question: "Do you have an AI incident response and escalation plan?",
    hint: "Defined process for failures, bias, and safety events",
    weight: 1,
    options: [
      "No incident plan",
      "General IT incident process only",
      "AI-specific plan drafted",
      "Approved plan with defined escalation paths",
      "Plan tested and metrics tracked"
    ]
  },
  {
    id: "L1-5",
    layer: "L1",
    level: 5,
    question: "Do you track AI value and ROI with defined KPIs?",
    hint: "Business outcomes, efficiency gains, risk reduction metrics",
    weight: 1,
    options: [
      "No value tracking",
      "Ad hoc success stories only",
      "KPIs defined but not consistently measured",
      "Regular reporting on AI value",
      "Value metrics integrated into business planning"
    ]
  },
  // L2: Information
  {
    id: "L2-1",
    layer: "L2",
    level: 1,
    question: "Are AI training and inference datasets classified?",
    hint: "PII, confidential, internal, public classification",
    weight: 1,
    options: [
      "No classification",
      "Some datasets informally tagged",
      "Classification scheme defined, partial coverage",
      "All AI datasets classified",
      "Classification enforced and audited"
    ]
  },
  {
    id: "L2-2",
    layer: "L2",
    level: 2,
    question: "Do you maintain data lineage for AI-relevant datasets?",
    hint: "Trace data from source to model input",
    weight: 1,
    options: [
      "No lineage tracking",
      "Manual documentation for key datasets",
      "Lineage tool in place, partial coverage",
      "Lineage documented for all AI datasets",
      "Automated lineage with change tracking"
    ]
  },
  {
    id: "L2-3",
    layer: "L2",
    level: 3,
    question: "Is there a master data management (MDM) approach for AI?",
    hint: "Single source of truth for key entities",
    weight: 1,
    options: [
      "No MDM for AI data",
      "Some golden sources identified",
      "MDM strategy defined, implementation in progress",
      "MDM in place for AI-critical entities",
      "MDM integrated with AI pipelines"
    ]
  },
  {
    id: "L2-4",
    layer: "L2",
    level: 4,
    question: "Do you have shadow AI discovery and governance processes?",
    hint: "Ungoverned AI usage detection and remediation",
    weight: 1,
    options: [
      "No shadow AI visibility",
      "Aware of some ungoverned usage",
      "Discovery process defined",
      "Regular discovery with remediation workflow",
      "Continuous monitoring and automated detection"
    ]
  },
  {
    id: "L2-5",
    layer: "L2",
    level: 5,
    question: "Are data stewards assigned for AI-critical datasets?",
    hint: "Accountability for data quality and compliance",
    weight: 1,
    options: [
      "No data stewards",
      "Informal ownership only",
      "Stewards identified for some datasets",
      "Stewards assigned for all AI-critical data",
      "Steward metrics and review cadence in place"
    ]
  },
  // L3: Application
  {
    id: "L3-1",
    layer: "L3",
    level: 1,
    question: "Do you maintain an AI asset inventory?",
    hint: "Models, agents, applications with metadata",
    weight: 1,
    options: [
      "No inventory",
      "Spreadsheet or ad hoc list",
      "Central registry in progress",
      "Complete inventory with metadata",
      "Inventory integrated with lifecycle management"
    ]
  },
  {
    id: "L3-2",
    layer: "L3",
    level: 2,
    question: "Are accountability assignments documented for AI assets?",
    hint: "Accountable, responsible, consulted parties",
    weight: 1,
    options: [
      "No accountability documented",
      "Some assets have informal owners",
      "RACI defined for high-risk assets",
      "All assets have documented accountability",
      "Accountability reviewed and attested"
    ]
  },
  {
    id: "L3-3",
    layer: "L3",
    level: 3,
    question: "Do you run gap analysis against compliance frameworks?",
    hint: "Control coverage vs EU AI Act, NIST, etc.",
    weight: 1,
    options: [
      "No gap analysis",
      "One-off assessment completed",
      "Gap analysis in progress",
      "Regular gap analysis with remediation tracking",
      "Gap analysis automated and integrated"
    ]
  },
  {
    id: "L3-4",
    layer: "L3",
    level: 4,
    question: "Is there a defined AI asset lifecycle (design to retire)?",
    hint: "Development, deployment, monitoring, decommission",
    weight: 1,
    options: [
      "No defined lifecycle",
      "Lifecycle stages informally understood",
      "Lifecycle documented for new assets",
      "Lifecycle applied across portfolio",
      "Lifecycle with gates and metrics"
    ]
  },
  {
    id: "L3-5",
    layer: "L3",
    level: 5,
    question: "Do you have controls for agentic and autonomous AI?",
    hint: "Human oversight, guardrails, escalation paths",
    weight: 1,
    options: [
      "No specific controls",
      "Ad hoc human review",
      "Controls defined for high-autonomy systems",
      "Guardrails and oversight in place",
      "Controls tested and continuously monitored"
    ]
  },
  // L4: Platform
  {
    id: "L4-1",
    layer: "L4",
    level: 1,
    question: "Do you scan AI assets for vulnerabilities and policy compliance?",
    hint: "SBOM, secrets, model scans, policy checks",
    weight: 1,
    options: [
      "No scanning",
      "Manual checks occasionally",
      "Scanning for some asset types",
      "Regular scanning across AI portfolio",
      "Scanning automated with policy enforcement"
    ]
  },
  {
    id: "L4-2",
    layer: "L4",
    level: 2,
    question: "Do you detect model and data drift?",
    hint: "Performance degradation, distribution shift",
    weight: 1,
    options: [
      "No drift detection",
      "Manual monitoring of key models",
      "Drift detection piloted",
      "Drift detection in production",
      "Drift detection with automated alerts"
    ]
  },
  {
    id: "L4-3",
    layer: "L4",
    level: 3,
    question: "Are alerts configured for AI anomalies and failures?",
    hint: "Real-time monitoring and notification",
    weight: 1,
    options: [
      "No AI-specific alerts",
      "Basic uptime monitoring only",
      "Alerts for critical failures",
      "Comprehensive alerting with runbooks",
      "Alerts with automated response workflows"
    ]
  },
  {
    id: "L4-4",
    layer: "L4",
    level: 4,
    question: "Is MLOps integrated with governance (versioning, approval)?",
    hint: "Model registry, promotion workflows",
    weight: 1,
    options: [
      "No MLOps governance",
      "Manual version tracking",
      "Model registry in use",
      "Promotion workflows with approval gates",
      "MLOps fully integrated with compliance"
    ]
  },
  {
    id: "L4-5",
    layer: "L4",
    level: 5,
    question: "Do you enforce guardrails (safety, PII, output filters)?",
    hint: "Input/output validation, content filters",
    weight: 1,
    options: [
      "No guardrails",
      "Basic input validation only",
      "Guardrails for high-risk systems",
      "Guardrails across production AI",
      "Guardrails with continuous validation"
    ]
  },
  // L5: Supply Chain
  {
    id: "L5-1",
    layer: "L5",
    level: 1,
    question: "Do you assess vendor assurance for AI providers?",
    hint: "SOC2, ISO, contract alignment",
    weight: 1,
    options: [
      "No vendor assessment",
      "Ad hoc checks for major vendors",
      "Assessment process defined",
      "Regular vendor assurance reviews",
      "Vendor assurance integrated with procurement"
    ]
  },
  {
    id: "L5-2",
    layer: "L5",
    level: 2,
    question: "Are model cards maintained for production models?",
    hint: "Intended use, limitations, evaluations",
    weight: 1,
    options: [
      "No model cards",
      "Informal documentation for some models",
      "Model card template in use",
      "Model cards for all production models",
      "Model cards with automated updates"
    ]
  },
  {
    id: "L5-3",
    layer: "L5",
    level: 3,
    question: "Do you track provenance (training data, model version)?",
    hint: "Lineage from data to deployed model",
    weight: 1,
    options: [
      "No provenance tracking",
      "Manual notes for key models",
      "Provenance captured in registry",
      "Provenance for all production models",
      "Provenance with audit trail"
    ]
  },
  {
    id: "L5-4",
    layer: "L5",
    level: 4,
    question: "Is vulnerability management applied to AI dependencies?",
    hint: "SBOM, CVE tracking, patching",
    weight: 1,
    options: [
      "No vulnerability management",
      "Manual checks for critical dependencies",
      "SBOM generated for some assets",
      "Vulnerability scanning across AI stack",
      "Automated patching with risk assessment"
    ]
  },
  {
    id: "L5-5",
    layer: "L5",
    level: 5,
    question: "Do you assess supply chain risk for AI components?",
    hint: "Vendor concentration, geopolitical, license risk",
    weight: 1,
    options: [
      "No supply chain risk assessment",
      "Informal awareness of key risks",
      "Risk assessment for major vendors",
      "Structured supply chain risk reviews",
      "Continuous supply chain risk monitoring"
    ]
  }
];

export const LAYER_LABELS: Record<MaturityLayer, string> = {
  L1: "Business",
  L2: "Information",
  L3: "Application",
  L4: "Platform",
  L5: "Supply Chain"
};

export const MATURITY_LEVEL_LABELS: Record<number, string> = {
  1: "M1 – Aware",
  2: "M2 – Documented",
  3: "M3 – Implemented",
  4: "M4 – Measured",
  5: "M5 – Optimised"
};

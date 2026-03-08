/**
 * Card normalizer – raw content to NormalizedCard.
 */

export type NormalizedCard = {
  modelName: string;
  version: string;
  organization: string;
  intendedUse: string;
  outOfScopeUse: string;
  trainingData: string;
  evaluations: Record<string, string>[];
  ethicsConsiderations: string;
  biasAnalysis: string;
  license: string;
  knownVulnerabilities: string[];
  limitations: string[];
  contactInfo: string;
  lastUpdated: string;
};

export type CardSource = "HUGGINGFACE" | "GITHUB" | "MANUAL";

const EMPTY_CARD: NormalizedCard = {
  modelName: "",
  version: "",
  organization: "",
  intendedUse: "",
  outOfScopeUse: "",
  trainingData: "",
  evaluations: [],
  ethicsConsiderations: "",
  biasAnalysis: "",
  license: "",
  knownVulnerabilities: [],
  limitations: [],
  contactInfo: "",
  lastUpdated: new Date().toISOString()
};

function extractFromMarkdown(md: string): Partial<NormalizedCard> {
  const out: Partial<NormalizedCard> = {};
  const sections: Record<string, keyof NormalizedCard> = {
    "Model Card": "modelName",
    "Intended Use": "intendedUse",
    "Out of Scope": "outOfScopeUse",
    "Training Data": "trainingData",
    "Ethics": "ethicsConsiderations",
    "Bias": "biasAnalysis",
    "License": "license",
    "Limitations": "limitations",
    "Contact": "contactInfo"
  };
  for (const [header, key] of Object.entries(sections)) {
    const re = new RegExp(`##\\s*${header}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, "i");
    const m = md.match(re);
    if (m) {
      const val = m[1].trim();
      if (key === "limitations") {
        out[key] = val.split("\n").map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
      } else {
        (out as Record<string, unknown>)[key] = val;
      }
    }
  }
  const idMatch = md.match(/^#\s*(.+?)(?:\s|$)/m);
  if (idMatch) out.modelName = idMatch[1].trim();
  return out;
}

function extractFromJSON(obj: Record<string, unknown>): Partial<NormalizedCard> {
  return {
    modelName: String(obj.modelId ?? obj.model_name ?? obj.name ?? ""),
    version: String(obj.version ?? ""),
    organization: String(obj.author ?? obj.organization ?? ""),
    intendedUse: String(obj.intended_use ?? obj.intendedUse ?? ""),
    outOfScopeUse: String(obj.out_of_scope ?? obj.outOfScopeUse ?? ""),
    trainingData: String(obj.training_data ?? obj.trainingData ?? ""),
    evaluations: Array.isArray(obj.evaluations) ? obj.evaluations as Record<string, string>[] : [],
    ethicsConsiderations: String(obj.ethics ?? obj.ethicsConsiderations ?? ""),
    biasAnalysis: String(obj.bias ?? obj.biasAnalysis ?? ""),
    license: String(obj.license ?? ""),
    knownVulnerabilities: Array.isArray(obj.known_vulnerabilities) ? obj.known_vulnerabilities as string[] : [],
    limitations: Array.isArray(obj.limitations) ? obj.limitations as string[] : [],
    contactInfo: String(obj.contact ?? obj.contactInfo ?? ""),
    lastUpdated: String(obj.last_updated ?? obj.lastUpdated ?? new Date().toISOString())
  };
}

export function normalizeCard(raw: Record<string, unknown>, source: CardSource): NormalizedCard {
  const partial: Partial<NormalizedCard> = {};

  if (source === "HUGGINGFACE") {
    Object.assign(partial, extractFromJSON(raw));
    const markdown = raw.cardMarkdown ?? raw.card_markdown;
    if (typeof markdown === "string") {
      Object.assign(partial, extractFromMarkdown(markdown));
    }
  } else if (source === "GITHUB") {
    const content = raw.content ?? raw.markdown;
    if (typeof content === "string") {
      Object.assign(partial, extractFromMarkdown(content));
    }
  } else {
    Object.assign(partial, extractFromJSON(raw));
  }

  return { ...EMPTY_CARD, ...partial };
}

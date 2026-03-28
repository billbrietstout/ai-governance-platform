export type CosaiLayerKey =
  | "LAYER_1_BUSINESS"
  | "LAYER_2_INFORMATION"
  | "LAYER_3_APPLICATION"
  | "LAYER_4_PLATFORM"
  | "LAYER_5_SUPPLY_CHAIN";

export const LAYER_META: Record<
  CosaiLayerKey,
  {
    label: string;
    shortLabel: string;
    number: number;
    bg: string;
    border: string;
    text: string;
    accent: string;
    accentHex: string;
  }
> = {
  LAYER_1_BUSINESS: {
    label: "Business & Governance",
    shortLabel: "Business",
    number: 1,
    bg: "bg-[var(--layer-1-bg)]",
    border: "border-[var(--layer-1-border)]",
    text: "text-[var(--layer-1-text)]",
    accent: "bg-[var(--layer-1-accent)]",
    accentHex: "#1a7a42" /* green */
  },
  LAYER_2_INFORMATION: {
    label: "Information & Data",
    shortLabel: "Information",
    number: 2,
    bg: "bg-[var(--layer-2-bg)]",
    border: "border-[var(--layer-2-border)]",
    text: "text-[var(--layer-2-text)]",
    accent: "bg-[var(--layer-2-accent)]",
    accentHex: "#2563eb" /* blue */
  },
  LAYER_3_APPLICATION: {
    label: "Application & Assets",
    shortLabel: "Application",
    number: 3,
    bg: "bg-[var(--layer-3-bg)]",
    border: "border-[var(--layer-3-border)]",
    text: "text-[var(--layer-3-text)]",
    accent: "bg-[var(--layer-3-accent)]",
    accentHex: "#c2410c" /* orange */
  },
  LAYER_4_PLATFORM: {
    label: "Platform & Operations",
    shortLabel: "Platform",
    number: 4,
    bg: "bg-[var(--layer-4-bg)]",
    border: "border-[var(--layer-4-border)]",
    text: "text-[var(--layer-4-text)]",
    accent: "bg-[var(--layer-4-accent)]",
    accentHex: "#be185d" /* pink */
  },
  LAYER_5_SUPPLY_CHAIN: {
    label: "Supply Chain",
    shortLabel: "Supply Chain",
    number: 5,
    bg: "bg-[var(--layer-5-bg)]",
    border: "border-[var(--layer-5-border)]",
    text: "text-[var(--layer-5-text)]",
    accent: "bg-[var(--layer-5-accent)]",
    accentHex: "#7c3aed" /* purple */
  }
};

export function getLayerMeta(layer: CosaiLayerKey) {
  return LAYER_META[layer];
}

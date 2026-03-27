/**
 * Human-readable labels for regulation discovery runs (avoid showing raw CUIDs in UI).
 */

const MAX_DESC_LEN = 72;

export function regulationDiscoveryTitle(
  asset: { name: string } | null | undefined,
  inputs: unknown
): string {
  const name = asset?.name?.trim();
  if (name) return name;

  if (inputs != null && typeof inputs === "object") {
    const desc = (inputs as { description?: unknown }).description;
    if (typeof desc === "string") {
      const t = desc.trim();
      if (t) return t.length > MAX_DESC_LEN ? `${t.slice(0, MAX_DESC_LEN - 1)}…` : t;
    }
  }

  return "Discovery run";
}

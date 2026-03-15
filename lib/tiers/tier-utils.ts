/**
 * Tier comparison utilities – no server deps, safe for client.
 */
export type OrgTier = "FREE" | "PRO" | "CONSULTANT" | "ENTERPRISE";

const TIER_RANK: Record<OrgTier, number> = {
  FREE: 0,
  PRO: 1,
  CONSULTANT: 2,
  ENTERPRISE: 3
};

export function tierMeets(orgTier: OrgTier, required: OrgTier): boolean {
  return TIER_RANK[orgTier] >= TIER_RANK[required];
}

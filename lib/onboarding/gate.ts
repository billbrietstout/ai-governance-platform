/**
 * Onboarding gate – determines when to show onboarding and redirect URLs.
 */

import type { Organization } from "@prisma/client";
import { getStepUrl } from "./steps";

/** Returns true if the org should see the onboarding wizard (not yet complete). */
export function shouldShowOnboarding(org: Pick<Organization, "onboardingComplete"> | null): boolean {
  return org != null && !org.onboardingComplete;
}

/** Returns the URL for the given onboarding step (1–5). Step 6 = complete → Posture Overview. */
export function getOnboardingRedirect(step: number): string {
  if (step >= 6) return "/dashboard";
  if (step >= 1 && step <= 5) return getStepUrl(step as 1 | 2 | 3 | 4 | 5);
  return "/onboarding/1";
}

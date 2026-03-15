/**
 * Onboarding wizard – 5-step flow with progress, navigation, and skip.
 */
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { OnboardingWizardShell } from "./OnboardingWizardShell";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const caller = await createServerCaller();
  const { data } = await caller.onboarding.getOnboardingState();

  if (data.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizardShell
      currentStep={data.currentStep}
      completedData={data.completedData}
      stepDef={data.stepDef}
    />
  );
}

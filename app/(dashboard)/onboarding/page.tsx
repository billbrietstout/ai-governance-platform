/**
 * Onboarding wizard – 5 steps.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const caller = await createServerCaller();
  const { data: status } = await caller.onboarding.getStatus();

  if (!status.needsOnboarding) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-1 text-slatePro-300">
          Complete setup in 5 steps.
        </p>
      </div>

      <OnboardingWizard />
    </main>
  );
}

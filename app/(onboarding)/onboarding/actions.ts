"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function saveStep1(data: {
  name: string;
  orgSize: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";
  primaryUseCase: string;
}) {
  const caller = await createServerCaller();
  await caller.onboarding.saveStep({
    stepId: 1,
    ...data
  });
}

export async function saveStep2(data: { clientVerticals: string[] }) {
  const caller = await createServerCaller();
  await caller.onboarding.saveStep({
    stepId: 2,
    ...data
  });
}

export async function saveStep3(data: {
  operatingModel: "IAAS" | "PAAS" | "AGENT_PAAS" | "SAAS" | "MIXED";
}) {
  const caller = await createServerCaller();
  await caller.onboarding.saveStep({
    stepId: 3,
    ...data
  });
}

export async function saveStep4(data: {
  assetName: string;
  assetType: "MODEL" | "PROMPT" | "AGENT" | "DATASET" | "APPLICATION" | "TOOL" | "PIPELINE";
  euRiskLevel: "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE";
  autonomyLevel: "HUMAN_ONLY" | "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS";
}) {
  const caller = await createServerCaller();
  await caller.onboarding.saveStep({
    stepId: 4,
    ...data
  });
}

export async function saveStep5(data: {
  answers: { questionId: string; answer: number; score: number }[];
}) {
  const caller = await createServerCaller();
  await caller.onboarding.saveStep({
    stepId: 5,
    ...data
  });
  revalidatePath("/");
  revalidatePath("/onboarding");
}

export async function skipOnboarding() {
  const caller = await createServerCaller();
  await caller.onboarding.skipOnboarding();
  revalidatePath("/");
  revalidatePath("/onboarding");
  redirect("/dashboard");
}

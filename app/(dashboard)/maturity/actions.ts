"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function submitMaturityAssessment(answers: { questionId: string; answer: number; score: number }[], notes?: string) {
  const caller = await createServerCaller();
  return caller.maturity.submitAssessment({ answers, notes });
}

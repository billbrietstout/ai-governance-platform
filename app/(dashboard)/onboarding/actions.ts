"use server";

import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export const onboardingActions = {
  async step1(formData: FormData) {
    const name = formData.get("name") as string;
    const verticalMarket = formData.get("verticalMarket") as string;
    const plan = formData.get("plan") as string;
    if (!name?.trim()) return { error: "Name required" };
    const caller = await createServerCaller();
    await caller.onboarding.updateOrgProfile({
      name: name.trim(),
      verticalMarket: verticalMarket as "GENERAL" | "HEALTHCARE" | "FINANCIAL" | "INSURANCE" | "AUTOMOTIVE" | "RETAIL" | "MANUFACTURING" | "PUBLIC_SECTOR" | "ENERGY",
      plan: plan as "FREE" | "TEAM" | "ENTERPRISE"
    });
    return null;
  },

  async step3(formData: FormData) {
    const caller = await createServerCaller();
    await caller.onboarding.activateFrameworks({ frameworkCodes: ["NIST_AI_RMF", "EU_AI_ACT", "COSAI_SRF", "NIST_CSF"] });
    return null;
  },

  async step5(formData: FormData) {
    const ROLES = ["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"] as const;
    const invites: { email: string; role: (typeof ROLES)[number] }[] = [];
    let i = 0;
    while (formData.get(`invite_${i}_email`)) {
      const email = formData.get(`invite_${i}_email`) as string;
      const roleRaw = formData.get(`invite_${i}_role`) as string;
      const role = ROLES.includes(roleRaw as (typeof ROLES)[number]) ? (roleRaw as (typeof ROLES)[number]) : "MEMBER";
      if (email?.trim()) invites.push({ email: email.trim(), role });
      i++;
    }
    if (invites.length > 0) {
      const caller = await createServerCaller();
      await caller.onboarding.inviteTeam({ invites });
    }
    redirect("/");
  }
};

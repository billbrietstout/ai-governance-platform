"use server";

import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function createAssessment(formData: FormData) {
  const name = formData.get("name") as string;
  const assetId = formData.get("assetId") as string;
  const frameworkIds = JSON.parse((formData.get("frameworkIds") as string) || "[]") as string[];
  const layersInScope = JSON.parse((formData.get("layersInScope") as string) || "[]") as string[];

  if (!name?.trim() || !assetId || frameworkIds.length === 0 || layersInScope.length === 0) {
    return { error: "Name, asset, frameworks, and layers required" };
  }

  const caller = await createServerCaller();
  const { data } = await caller.assessment.create({
    name: name.trim(),
    assetId,
    frameworkIds,
    layersInScope
  });

  redirect(`/assessments/${data.id}`);
}

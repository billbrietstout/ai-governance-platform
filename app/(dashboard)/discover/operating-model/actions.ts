"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function setOperatingModel(model: "IAAS" | "PAAS" | "AGENT_PAAS" | "SAAS") {
  const caller = await createServerCaller();
  await caller.discovery.setOperatingModel({ operatingModel: model });
}

"use server";

import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function createAsset(formData: FormData) {
  const name = formData.get("name") as string;
  const assetType = formData.get("assetType") as string;
  const cosaiLayer = formData.get("cosaiLayer") as string | null;
  const createAccountability = formData.get("createAccountability") === "on";
  const sourceEntityIds = (formData.getAll("sourceEntityIds") as string[]).filter(Boolean);

  if (!name?.trim() || !assetType) {
    return { error: "Name and asset type required" };
  }

  const caller = await createServerCaller();
  try {
    const { data: asset } = await caller.assets.create({
      name: name.trim(),
      description: (formData.get("description") as string) || undefined,
      assetType: assetType as
        | "MODEL"
        | "PROMPT"
        | "AGENT"
        | "DATASET"
        | "APPLICATION"
        | "TOOL"
        | "PIPELINE",
      euRiskLevel:
        (formData.get("euRiskLevel") as "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE") ||
        undefined,
      operatingModel:
        (formData.get("operatingModel") as "IN_HOUSE" | "VENDOR" | "HYBRID") || undefined,
      cosaiLayer:
        (cosaiLayer as
          | "LAYER_1_BUSINESS"
          | "LAYER_2_INFORMATION"
          | "LAYER_3_APPLICATION"
          | "LAYER_4_PLATFORM"
          | "LAYER_5_SUPPLY_CHAIN") || undefined,
      autonomyLevel:
        (formData.get("autonomyLevel") as
          | "HUMAN_ONLY"
          | "ASSISTED"
          | "SEMI_AUTONOMOUS"
          | "AUTONOMOUS") || undefined,
      verticalMarket:
        (formData.get("verticalMarket") as
          | "GENERAL"
          | "HEALTHCARE"
          | "FINANCIAL"
          | "AUTOMOTIVE"
          | "RETAIL"
          | "MANUFACTURING"
          | "PUBLIC_SECTOR") || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      createAccountability: createAccountability && !!cosaiLayer
    });

    if (sourceEntityIds.length > 0 && asset?.id) {
      await caller.layer2.linkDataSourcesToAsset({ assetId: asset.id, sourceEntityIds });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return { error: msg };
  }

  redirect("/layer3-application/assets");
}

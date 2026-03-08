/**
 * Card sync – schedule, detect changes, alert on updates.
 */
import type { NormalizedCard } from "./normalizer";
import type { PrismaClient } from "@prisma/client";

export type ChangeReport = {
  changed: boolean;
  addedFields: string[];
  removedFields: string[];
  modifiedFields: string[];
  summary: string;
};

export type SyncFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export async function scheduleCardSync(
  prisma: PrismaClient,
  assetId: string,
  frequency: SyncFrequency
): Promise<void> {
  const card = await prisma.artifactCard.findFirst({
    where: { assetId }
  });
  if (!card) return;

  const nextSync = new Date();
  if (frequency === "DAILY") nextSync.setDate(nextSync.getDate() + 1);
  else if (frequency === "WEEKLY") nextSync.setDate(nextSync.getDate() + 7);
  else nextSync.setMonth(nextSync.getMonth() + 1);

  await prisma.artifactCard.update({
    where: { id: card.id },
    data: {
      lastSyncedAt: new Date(),
      syncStatus: "SYNCED"
    }
  });
}

export function detectCardChanges(assetId: string, newCard: NormalizedCard, existing: NormalizedCard | null): ChangeReport {
  const addedFields: string[] = [];
  const removedFields: string[] = [];
  const modifiedFields: string[] = [];

  const keys = Object.keys(newCard) as (keyof NormalizedCard)[];
  for (const k of keys) {
    const newVal = newCard[k];
    const oldVal = existing?.[k];
    const newStr = typeof newVal === "string" ? newVal : JSON.stringify(newVal ?? "");
    const oldStr = typeof oldVal === "string" ? oldVal : JSON.stringify(oldVal ?? "");

    if (!existing) {
      if (newStr) addedFields.push(k);
    } else if (!oldStr && newStr) {
      addedFields.push(k);
    } else if (oldStr && !newStr) {
      removedFields.push(k);
    } else if (oldStr !== newStr) {
      modifiedFields.push(k);
    }
  }

  if (existing) {
    const existingKeys = Object.keys(existing) as (keyof NormalizedCard)[];
    for (const k of existingKeys) {
      if (!(k in newCard) && (existing[k] as string)?.length) {
        removedFields.push(k);
      }
    }
  }

  const changed = addedFields.length > 0 || removedFields.length > 0 || modifiedFields.length > 0;
  const summary = changed
    ? `Model behaviour may have changed: ${addedFields.length} added, ${removedFields.length} removed, ${modifiedFields.length} modified`
    : "No changes detected";

  return {
    changed,
    addedFields,
    removedFields,
    modifiedFields,
    summary
  };
}

/**
 * Retention policy per resource type.
 */

export type ResourceType = "AuditLog" | "TelemetryEvent" | "ScanRecord";

export const RETENTION_DAYS: Record<ResourceType, number> = {
  AuditLog: 7 * 365, // 7 years
  TelemetryEvent: 90,
  ScanRecord: 2 * 365 // 2 years
};

export function getRetentionDays(resourceType: ResourceType): number {
  return RETENTION_DAYS[resourceType] ?? 365;
}

export function getRetentionCutoff(resourceType: ResourceType): Date {
  const days = getRetentionDays(resourceType);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

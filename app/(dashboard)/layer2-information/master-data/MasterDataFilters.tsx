"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const ENTITY_TYPES = [
  "ALL",
  "CUSTOMER",
  "PRODUCT",
  "VENDOR",
  "EMPLOYEE",
  "FINANCE",
  "LOCATION",
  "OTHER"
] as const;
const CLASSIFICATIONS = ["ALL", "PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const;
const AI_ACCESS = ["ALL", "OPEN", "GOVERNED", "RESTRICTED", "PROHIBITED"] as const;

export function MasterDataFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "ALL" || !value) next.delete(key);
      else next.set(key, value);
      router.push(`/layer2-information/master-data?${next.toString()}`);
    },
    [router, searchParams]
  );

  const type = searchParams.get("type") ?? "ALL";
  const classification = searchParams.get("classification") ?? "ALL";
  const aiAccess = searchParams.get("aiAccess") ?? "ALL";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-600">Entity type:</span>
      <select
        value={type}
        onChange={(e) => update("type", e.target.value)}
        className="rounded border border-slate-200 px-2 py-1 text-sm"
      >
        {ENTITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span className="ml-2 text-sm font-medium text-slate-600">Classification:</span>
      <select
        value={classification}
        onChange={(e) => update("classification", e.target.value)}
        className="rounded border border-slate-200 px-2 py-1 text-sm"
      >
        {CLASSIFICATIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <span className="ml-2 text-sm font-medium text-slate-600">AI Access:</span>
      <select
        value={aiAccess}
        onChange={(e) => update("aiAccess", e.target.value)}
        className="rounded border border-slate-200 px-2 py-1 text-sm"
      >
        {AI_ACCESS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}

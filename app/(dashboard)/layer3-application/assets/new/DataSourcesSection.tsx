"use client";

import { useState, useMemo } from "react";
import { Database, AlertTriangle } from "lucide-react";

const CLASSIFICATION_ORDER = ["RESTRICTED", "CONFIDENTIAL", "INTERNAL", "PUBLIC"];

type Entity = { id: string; name: string; classification: string };

type Props = {
  entities: Entity[];
};

export function DataSourcesSection({ entities }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const highestClassification = useMemo(() => {
    const selected = entities.filter((e) => selectedIds.has(e.id));
    for (const c of CLASSIFICATION_ORDER) {
      if (selected.some((e) => e.classification === c)) return c;
    }
    return null;
  }, [entities, selectedIds]);

  const showRestrictedWarning = highestClassification === "RESTRICTED";

  return (
    <div className="border-slatePro-600 bg-slatePro-900/50 space-y-3 rounded-lg border p-4">
      <h3 className="text-slatePro-300 flex items-center gap-2 text-sm font-medium">
        <Database className="h-4 w-4" />
        Data Sources
      </h3>
      <p className="text-slatePro-400 text-xs">
        Link master data entities this asset will access. Used for lineage and classification.
      </p>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {entities.map((e) => (
          <label
            key={e.id}
            className="hover:bg-slatePro-800/50 flex cursor-pointer items-center gap-2 rounded px-2 py-1"
          >
            <input
              type="checkbox"
              name="sourceEntityIds"
              value={e.id}
              checked={selectedIds.has(e.id)}
              onChange={() => toggle(e.id)}
              className="border-slatePro-600 rounded"
            />
            <span className="text-sm text-gray-900">{e.name}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                e.classification === "RESTRICTED"
                  ? "bg-red-100 text-red-700"
                  : e.classification === "CONFIDENTIAL"
                    ? "bg-amber-100 text-amber-700"
                    : e.classification === "INTERNAL"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {e.classification}
            </span>
          </label>
        ))}
      </div>
      {showRestrictedWarning && (
        <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            This asset accesses RESTRICTED data — enhanced controls required
          </p>
        </div>
      )}
    </div>
  );
}

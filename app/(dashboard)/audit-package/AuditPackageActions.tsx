"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { generateAuditPackage } from "./actions";

type Props = {
  assetId?: string;
  regulationCode?: string;
};

export function AuditPackageActions({ assetId, regulationCode }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!assetId && !regulationCode) return;
    setGenerating(true);
    try {
      const data = await generateAuditPackage({ assetId, regulationCode });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-package-${assetId ?? "all"}-${regulationCode ?? "all"}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={generating || (!assetId && !regulationCode)}
      className="bg-navy-600 hover:bg-navy-500 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      <FileDown className="h-4 w-4" />
      {generating ? "Generating…" : "Generate Package"}
    </button>
  );
}

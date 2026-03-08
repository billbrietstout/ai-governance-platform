"use client";

import { useState } from "react";
import { requestDataExport } from "../actions";

export function GDPRRequests() {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setExported(null);
    try {
      const data = await requestDataExport();
      setExported(JSON.stringify(data, null, 2));
    } catch (e) {
      setExported(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <h2 className="text-sm font-medium text-slatePro-300">GDPR requests</h2>
      <p className="mt-2 text-sm text-slatePro-500">
        Export your data (right to data portability). Erasure requests: contact support.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="mt-3 rounded bg-navy-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
      >
        {loading ? "Exporting…" : "Export my data"}
      </button>
      {exported && (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-slatePro-900 p-3 text-xs text-slatePro-300">
          {exported}
        </pre>
      )}
    </div>
  );
}

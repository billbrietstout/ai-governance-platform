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
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-gray-900">GDPR requests</h2>
      <p className="mt-2 text-sm text-gray-600">
        Export your data (right to data portability). Erasure requests: contact support.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="bg-navy-600 hover:bg-navy-500 mt-3 rounded px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Exporting…" : "Export my data"}
      </button>
      {exported && (
        <pre className="mt-3 max-h-64 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
          {exported}
        </pre>
      )}
    </div>
  );
}

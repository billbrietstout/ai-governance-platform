"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runDiscoveryForAsset } from "./actions";

type Asset = { id: string; name: string; assetType: string };

export function DiscoverClient({
  assets,
  className = ""
}: {
  assets: Asset[];
  className?: string;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const id = await runDiscoveryForAsset(assetId);
      router.push(`/discover/results/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run discovery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <select
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
      >
        <option value="">— Select an asset —</option>
        {assets.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.assetType})
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleRun}
        disabled={!assetId || loading}
        className="bg-navy-600 hover:bg-navy-500 mt-2 w-full rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Running…" : "Run discovery"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

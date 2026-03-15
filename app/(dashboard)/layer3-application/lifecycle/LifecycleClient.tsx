"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, AlertTriangle, ChevronRight, History } from "lucide-react";
import { promoteLifecycleStage, demoteLifecycleStage } from "./actions";

const STAGES = ["DEVELOPMENT", "TESTING", "STAGING", "PRODUCTION", "DEPRECATED", "RETIRED"] as const;

const STAGE_COLORS: Record<string, string> = {
  DEVELOPMENT: "border-slate-200 bg-slate-50",
  TESTING: "border-blue-200 bg-blue-50",
  STAGING: "border-amber-200 bg-amber-50",
  PRODUCTION: "border-emerald-200 bg-emerald-50",
  DEPRECATED: "border-red-200 bg-red-50",
  RETIRED: "border-gray-200 bg-gray-100"
};

const RISK_COLORS: Record<string, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  UNACCEPTABLE: "bg-red-100 text-red-700"
};

type Asset = {
  id: string;
  name: string;
  assetType: string;
  euRiskLevel: string | null;
  lifecycleStage: string;
  lifecycleUpdatedAt: Date | null;
  owner: { id: string; email: string } | null;
  lifecycleTransitions: { fromStage: string; toStage: string; direction: string; createdAt: Date; notes: string | null }[];
};

type Board = {
  byStage: Record<string, Asset[]>;
  assets: Asset[];
};

type Props = { board: Board };

function daysInStage(updatedAt: Date | null, stage: string): number {
  if (!updatedAt) return 0;
  const d = new Date(updatedAt);
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export function LifecycleClient({ board }: Props) {
  const [promoting, setPromoting] = useState<string | null>(null);
  const [demoting, setDemoting] = useState<string | null>(null);
  const [confirmPromote, setConfirmPromote] = useState<{ asset: Asset; nextStage: string } | null>(null);
  const [confirmDemote, setConfirmDemote] = useState<{ asset: Asset; prevStage: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);

  const [assets, setAssets] = useState(board.assets);
  const byStage: Record<string, Asset[]> = {};
  for (const s of STAGES) byStage[s] = [];
  for (const a of assets) {
    const s = a.lifecycleStage || "DEVELOPMENT";
    if (byStage[s]) byStage[s].push(a);
  }

  const handlePromote = async () => {
    if (!confirmPromote) return;
    setPromoting(confirmPromote.asset.id);
    try {
      await promoteLifecycleStage({ id: confirmPromote.asset.id, notes: notes || undefined });
      setAssets((prev) =>
        prev.map((a) =>
          a.id === confirmPromote.asset.id
            ? {
                ...a,
                lifecycleStage: confirmPromote.nextStage,
                lifecycleUpdatedAt: new Date(),
                lifecycleTransitions: [
                  {
                    fromStage: a.lifecycleStage,
                    toStage: confirmPromote.nextStage,
                    direction: "PROMOTE",
                    createdAt: new Date(),
                    notes: notes || null
                  },
                  ...a.lifecycleTransitions
                ]
              }
            : a
        )
      );
      setConfirmPromote(null);
      setNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setPromoting(null);
    }
  };

  const handleDemote = async () => {
    if (!confirmDemote) return;
    setDemoting(confirmDemote.asset.id);
    try {
      await demoteLifecycleStage({ id: confirmDemote.asset.id, notes: notes || undefined });
      setAssets((prev) =>
        prev.map((a) =>
          a.id === confirmDemote.asset.id
            ? {
                ...a,
                lifecycleStage: confirmDemote.prevStage,
                lifecycleUpdatedAt: new Date(),
                lifecycleTransitions: [
                  {
                    fromStage: a.lifecycleStage,
                    toStage: confirmDemote.prevStage,
                    direction: "DEMOTE",
                    createdAt: new Date(),
                    notes: notes || null
                  },
                  ...a.lifecycleTransitions
                ]
              }
            : a
        )
      );
      setConfirmDemote(null);
      setNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setDemoting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className={`min-w-[220px] flex-1 rounded-lg border-2 p-3 ${STAGE_COLORS[stage] ?? "border-slate-200 bg-white"}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">{stage}</h3>
              <span className="rounded bg-white/80 px-2 py-0.5 text-xs text-slate-600">
                {(byStage[stage] ?? []).length}
              </span>
            </div>
            <div className="space-y-2">
              {(byStage[stage] ?? []).map((a) => {
                const days = daysInStage(a.lifecycleUpdatedAt, stage);
                const isProd90d = stage === "PRODUCTION" && days > 90;
                const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
                const nextStage = STAGES[idx + 1];
                const prevStage = STAGES[idx - 1];
                return (
                  <div
                    key={a.id}
                    className={`rounded border border-slate-200 bg-white p-3 shadow-sm ${isProd90d ? "border-amber-400 bg-amber-50/50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link
                        href={`/layer3-application/assets/${a.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {a.name}
                      </Link>
                      {isProd90d && (
                        <span
                          className="shrink-0"
                          title="In PRODUCTION 90+ days with no attestation update"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500">{a.assetType}</span>
                      {a.euRiskLevel && (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${RISK_COLORS[a.euRiskLevel] ?? ""}`}>
                          {a.euRiskLevel}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500" suppressHydrationWarning>
                      {a.owner?.email ?? "No owner"} • {days}d in stage
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {nextStage && (
                        <button
                          type="button"
                          onClick={() => setConfirmPromote({ asset: a, nextStage })}
                          disabled={!!promoting}
                          className="flex items-center gap-0.5 rounded bg-navy-600 px-2 py-1 text-xs text-white hover:bg-navy-500 disabled:opacity-50"
                        >
                          <ArrowUp className="h-3 w-3" />
                          Promote
                        </button>
                      )}
                      {prevStage && (
                        <button
                          type="button"
                          onClick={() => setConfirmDemote({ asset: a, prevStage })}
                          disabled={!!demoting}
                          className="flex items-center gap-0.5 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                        >
                          <ArrowDown className="h-3 w-3" />
                          Demote
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setHistoryAsset(a)}
                        className="flex items-center gap-0.5 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        <History className="h-3 w-3" />
                        History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Promote confirmation modal */}
      {confirmPromote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-medium text-slate-900">Promote to {confirmPromote.nextStage}?</h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmPromote.asset.name} will move from {confirmPromote.asset.lifecycleStage} to{" "}
              {confirmPromote.nextStage}.
            </p>
            {confirmPromote.asset.euRiskLevel === "HIGH" && confirmPromote.nextStage === "PRODUCTION" && (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-800">HIGH risk checklist (required):</p>
                <ul className="mt-1 list-inside list-disc text-amber-700">
                  <li>Control attestation exists</li>
                  <li>Accountability assigned</li>
                  <li>Bias assessment completed (if applicable)</li>
                  <li>Human oversight configured (if L3+ autonomy)</li>
                </ul>
              </div>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setConfirmPromote(null); setNotes(""); }}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromote}
                disabled={promoting === confirmPromote.asset.id}
                className="rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500 disabled:opacity-50"
              >
                {promoting === confirmPromote.asset.id ? "Promoting…" : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote confirmation modal */}
      {confirmDemote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-medium text-slate-900">Demote to {confirmDemote.prevStage}?</h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmDemote.asset.name} will move back from {confirmDemote.asset.lifecycleStage} to{" "}
              {confirmDemote.prevStage}.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setConfirmDemote(null); setNotes(""); }}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDemote}
                disabled={demoting === confirmDemote.asset.id}
                className="rounded bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-500 disabled:opacity-50"
              >
                {demoting === confirmDemote.asset.id ? "Demoting…" : "Demote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition history modal */}
      {historyAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Stage transitions — {historyAsset.name}</h3>
              <button type="button" onClick={() => setHistoryAsset(null)} className="text-slate-500 hover:text-slate-700">
                ×
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {historyAsset.lifecycleTransitions.map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                  <span className={t.direction === "PROMOTE" ? "text-emerald-600" : "text-amber-600"}>
                    {t.direction}
                  </span>
                  <span>
                    {t.fromStage} → {t.toStage}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  {t.notes && <span className="text-xs text-slate-500">— {t.notes}</span>}
                </li>
              ))}
            </ul>
            {historyAsset.lifecycleTransitions.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">No transitions yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Camera, Eye, GitCompare } from "lucide-react";
import { takeSnapshot, compareSnapshots } from "./actions";
import { ComplianceTrendChart } from "@/components/compliance/ComplianceTrendChart";

type Snapshot = {
  id: string;
  createdAt: Date;
  snapshotType: string;
  frameworkCode: string | null;
  overallScore: number;
  layerScores: unknown;
  assetCount: number;
  controlsCompliant: number;
  controlsTotal: number;
  gapCount: number;
  evidenceCompleteness: number;
  notes: string | null;
  creator?: { email: string } | null;
};

type Props = { initialSnapshots: Snapshot[] };

const TYPE_BADGES: Record<string, string> = {
  MANUAL: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PRE_AUDIT: "bg-amber-100 text-amber-700"
};

function Sparkline({ scores }: { scores: Record<string, number> }) {
  const data = ["L1", "L2", "L3", "L4", "L5"].map((l) => ({
    layer: l,
    score: scores[l] ?? 0
  }));
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SnapshotsClient({ initialSnapshots }: Props) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [taking, setTaking] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const tableRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [compareResult, setCompareResult] = useState<{
    snapshot1: {
      id: string;
      createdAt: Date;
      overallScore: number;
      gapCount: number;
      assetCount: number;
    };
    snapshot2: {
      id: string;
      createdAt: Date;
      overallScore: number;
      gapCount: number;
      assetCount: number;
    };
    overallDelta: number;
    gapCountDelta: number;
    assetCountDelta: number;
    evidenceCompletenessDelta: number;
    layerDiff: { layer: string; score1: number; score2: number; delta: number }[];
  } | null>(null);

  const handleTakeSnapshot = async () => {
    setTaking(true);
    try {
      const created = await takeSnapshot({});
      setSnapshots((prev) => [created, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setTaking(false);
    }
  };

  const handleSnapshotClick = useCallback((id: string) => {
    setHighlightedId(id);
    const row = tableRowRefs.current[id];
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedId(null), 2000);
    }
  }, []);

  const handleCompare = async () => {
    if (!compareIds[0] || !compareIds[1]) return;
    try {
      const res = await compareSnapshots(compareIds[0], compareIds[1]);
      setCompareResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Take Snapshot */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          Capture the current compliance state for audit trail and trend analysis.
        </p>
        <button
          type="button"
          onClick={handleTakeSnapshot}
          disabled={taking}
          className="bg-navy-600 hover:bg-navy-500 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          {taking ? "Capturing…" : "Take Snapshot"}
        </button>
      </div>

      {/* Trend chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-medium text-slate-700">Compliance trend</h3>
        <ComplianceTrendChart
          snapshots={snapshots}
          onSnapshotClick={handleSnapshotClick}
          emptyStateAction={
            <button
              type="button"
              onClick={handleTakeSnapshot}
              disabled={taking}
              className="bg-navy-600 hover:bg-navy-500 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {taking ? "Capturing…" : "Take Snapshot"}
            </button>
          }
        />
      </div>

      {/* Compare snapshots */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <GitCompare className="h-4 w-4" />
          Compare two snapshots
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={compareIds[0] ?? ""}
            onChange={(e) => setCompareIds(([_, b]) => [e.target.value || null, b])}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">— Select snapshot 1 —</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt).toLocaleString()} ({s.overallScore}%)
              </option>
            ))}
          </select>
          <span className="text-slate-500">vs</span>
          <select
            value={compareIds[1] ?? ""}
            onChange={(e) => setCompareIds(([a]) => [a, e.target.value || null])}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">— Select snapshot 2 —</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.createdAt).toLocaleString()} ({s.overallScore}%)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCompare}
            disabled={!compareIds[0] || !compareIds[1]}
            className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500 disabled:opacity-50"
          >
            Compare
          </button>
        </div>
        {compareResult && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500">Snapshot 1</div>
              <div className="mt-1 text-sm">
                {new Date(compareResult.snapshot1.createdAt).toLocaleString()}
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span>Score: {compareResult.snapshot1.overallScore}%</span>
                <span>Gaps: {compareResult.snapshot1.gapCount}</span>
                <span>Assets: {compareResult.snapshot1.assetCount}</span>
              </div>
            </div>
            <div className="rounded border border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500">Snapshot 2</div>
              <div className="mt-1 text-sm">
                {new Date(compareResult.snapshot2.createdAt).toLocaleString()}
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span>Score: {compareResult.snapshot2.overallScore}%</span>
                <span>Gaps: {compareResult.snapshot2.gapCount}</span>
                <span>Assets: {compareResult.snapshot2.assetCount}</span>
              </div>
            </div>
          </div>
        )}
        {compareResult && (
          <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500">Delta</div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span
                className={compareResult.overallDelta >= 0 ? "text-emerald-600" : "text-red-600"}
              >
                Score: {compareResult.overallDelta >= 0 ? "+" : ""}
                {compareResult.overallDelta}%
              </span>
              <span
                className={compareResult.gapCountDelta <= 0 ? "text-emerald-600" : "text-red-600"}
              >
                Gaps: {compareResult.gapCountDelta >= 0 ? "+" : ""}
                {compareResult.gapCountDelta}
              </span>
              <span>
                Assets: {compareResult.assetCountDelta >= 0 ? "+" : ""}
                {compareResult.assetCountDelta}
              </span>
              <span>
                Evidence: {compareResult.evidenceCompletenessDelta >= 0 ? "+" : ""}
                {compareResult.evidenceCompletenessDelta.toFixed(1)}%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
              {compareResult.layerDiff.map((d) => (
                <div key={d.layer} className="rounded bg-white px-2 py-1">
                  <div className="font-medium">{d.layer}</div>
                  <div className="text-slate-600">
                    {d.score1} → {d.score2}
                    <span className={d.delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {" "}
                      ({d.delta >= 0 ? "+" : ""}
                      {d.delta})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Snapshot history table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Framework
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Layer scores
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Gaps
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Evidence %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Created by
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {snapshots.map((s) => (
              <tr
                key={s.id}
                ref={(el) => {
                  tableRowRefs.current[s.id] = el;
                }}
                className={`hover:bg-slate-50 ${highlightedId === s.id ? "bg-amber-50 ring-1 ring-amber-300" : ""}`}
              >
                <td className="px-4 py-3 text-sm text-slate-900">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[s.snapshotType] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {s.snapshotType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.frameworkCode ?? "—"}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.overallScore}%</td>
                <td className="px-4 py-3">
                  <Sparkline scores={(s.layerScores ?? {}) as Record<string, number>} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.gapCount}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.evidenceCompleteness}%</td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.creator?.email ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/compliance/snapshots/${s.id}`}
                    className="text-navy-600 flex items-center gap-1 text-sm hover:underline"
                  >
                    <Eye className="h-4 w-4" />
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {snapshots.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No snapshots yet. Take a snapshot to capture your current compliance state.
          </div>
        )}
      </div>
    </div>
  );
}

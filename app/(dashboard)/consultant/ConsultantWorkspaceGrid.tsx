"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SwitchWorkspaceButton } from "./SwitchWorkspaceButton";

type Workspace = {
  id: string;
  clientOrgId: string;
  clientName: string;
  clientOrg: { maturityLevel: number; updatedAt: Date };
  complianceScore: number;
  lastSnapshot: Date | null;
  assetCount: number;
  clientVertical?: string | null;
};

export function ConsultantWorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <p className="text-slate-600">No client workspaces yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first client assessment to get started.
        </p>
        <Link
          href="/consultant/new"
          className="bg-navy-600 hover:bg-navy-500 mt-6 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white"
        >
          New client workspace
        </Link>
      </div>
    );
  }

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDaysAgo = (d: Date | string | null) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated 1 day ago";
    return `Updated ${days} days ago`;
  };

  const maturityLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "Initial",
      2: "Developing",
      3: "Defined",
      4: "Managed",
      5: "Optimizing"
    };
    return `M${level} — ${labels[level] ?? "Unknown"}`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((w) => (
        <div
          key={w.id}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="font-semibold text-slate-900">{w.clientName}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {w.clientVertical && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {w.clientVertical}
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {maturityLabel(w.clientOrg.maturityLevel)}
            </span>
          </div>
          {w.complianceScore > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, w.complianceScore)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {Math.round(w.complianceScore)}% compliance
              </span>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">{w.assetCount} AI systems</p>
          <p className="text-xs text-slate-500">
            {formatDaysAgo(w.lastSnapshot ?? w.clientOrg.updatedAt)}
          </p>
          <div className="mt-4 flex gap-2">
            <SwitchWorkspaceButton clientOrgId={w.clientOrgId} clientName={w.clientName}>
              Open workspace →
            </SwitchWorkspaceButton>
            <Link
              href={`/consultant?summary=${w.clientOrgId}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              View summary
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

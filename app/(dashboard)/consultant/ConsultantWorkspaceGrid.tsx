"use client";

import Link from "next/link";
import { SwitchWorkspaceButton } from "./SwitchWorkspaceButton";

type Workspace = {
  id: string;
  clientOrgId: string;
  clientName: string;
  maturityLevel: number;
  lastActivity: Date;
  complianceScore: number | null;
  createdAt: Date;
};

export function ConsultantWorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <p className="text-slate-600">No client workspaces yet.</p>
        <p className="mt-1 text-sm text-slate-500">Create your first client assessment.</p>
        <Link
          href="/consultant/new"
          className="mt-6 inline-flex items-center rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-500"
        >
          New client workspace
        </Link>
      </div>
    );
  }

  const formatDate = (d: Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Level {w.maturityLevel}
            </span>
            {w.complianceScore != null && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {Math.round(w.complianceScore)}% compliance
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Last activity: {formatDate(w.lastActivity)}</p>
          <SwitchWorkspaceButton clientOrgId={w.clientOrgId}>
            Open workspace
          </SwitchWorkspaceButton>
        </div>
      ))}
    </div>
  );
}

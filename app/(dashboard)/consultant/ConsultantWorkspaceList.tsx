"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ConsultantWorkspaceGrid } from "./ConsultantWorkspaceGrid";

type Workspace = {
  id: string;
  clientOrgId: string;
  clientName: string;
  clientVertical?: string | null;
  clientOrg: { maturityLevel: number; updatedAt: Date };
  complianceScore: number;
  lastSnapshot: Date | null;
  assetCount: number;
};

export function ConsultantWorkspaceList({ workspaces }: { workspaces: Workspace[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return workspaces;
    const q = search.toLowerCase().trim();
    return workspaces.filter(
      (w) =>
        w.clientName.toLowerCase().includes(q) ||
        (w.clientVertical?.toLowerCase().includes(q) ?? false)
    );
  }, [workspaces, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search workspaces by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        <Link
          href="/consultant/new"
          className="inline-flex items-center rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-500"
        >
          New client +
        </Link>
      </div>
      <ConsultantWorkspaceGrid workspaces={filtered} />
    </div>
  );
}

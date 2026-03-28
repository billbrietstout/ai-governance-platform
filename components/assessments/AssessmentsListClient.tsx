"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getTrpcBrowser } from "@/lib/trpc/browser-client";

type Row = {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
  asset: { id: string; name: string };
};

type Props = {
  initialRows: Row[];
  initialNextCursor: string | null;
  totalCount: number;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved"
};

export function AssessmentsListClient({
  initialRows,
  initialNextCursor,
  totalCount
}: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const trpc = getTrpcBrowser();
      const res = await trpc.assessment.list.query({
        cursor: nextCursor,
        limit: 25
      });
      setRows((prev) => [...prev, ...(res.data as Row[])]);
      setNextCursor(res.meta.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  return (
    <>
      <p className="text-sm text-slate-600">
        {totalCount} assessment{totalCount !== 1 ? "s" : ""} total
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Asset</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/assessments/${a.id}`}
                    className="font-medium text-navy-600 hover:underline"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{a.asset.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {statusLabels[a.status] ?? a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="focus-visible:ring-navy-500 text-sm font-medium text-navy-600 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

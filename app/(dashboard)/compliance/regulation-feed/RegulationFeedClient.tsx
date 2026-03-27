"use client";

import Link from "next/link";
import { Bell, Calendar, ExternalLink } from "lucide-react";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

type Item = {
  id: string;
  name: string;
  item: string;
  jurisdiction: string;
  deadline: string;
  status: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  affectedCount: number | null;
};

type Props = { items: Item[] };

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-700"
};

const JURISDICTION_COLORS: Record<string, string> = {
  EU: "bg-blue-100 text-blue-700",
  US: "bg-purple-100 text-purple-700",
  Global: "bg-slate-100 text-slate-700"
};

// Placeholder: next 3 deadlines (mock data for "Your deadlines")
const YOUR_DEADLINES = [
  {
    id: "eu-ai-act-high-risk",
    name: "EU AI Act — High-risk requirements",
    daysRemaining: 140,
    impact: "HIGH" as const
  },
  {
    id: "sr11-7",
    name: "SR 11-7 — Model risk guidance",
    daysRemaining: 180,
    impact: "HIGH" as const
  },
  {
    id: "eu-ai-act-annex1",
    name: "EU AI Act — Annex I high-risk",
    daysRemaining: 870,
    impact: "MEDIUM" as const
  }
];

export function RegulationFeedClient({ items }: Props) {
  return (
    <div className="space-y-8">
      {/* Your deadlines */}
      <div className="border-navy-200 bg-navy-50 rounded-lg border p-4">
        <h2 className={`${SECTION_HEADING_CLASS} flex items-center gap-2`}>
          <Calendar className="text-navy-600 h-4 w-4" />
          Your deadlines
        </h2>
        <p className="mb-3 text-xs text-slate-600">
          Next 3 deadlines affecting this org&apos;s assets, sorted by urgency.
        </p>
        <ul className="space-y-2">
          {YOUR_DEADLINES.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-900">{d.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${IMPACT_COLORS[d.impact]}`}
                >
                  {d.impact}
                </span>
                <span className="text-sm text-slate-600">{d.daysRemaining} days remaining</span>
                <Link
                  href="/layer3-application/assets"
                  className="text-navy-600 text-xs hover:underline"
                >
                  View affected assets →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Subscribe placeholder */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-900">Get notified of regulatory changes</p>
            <p className="text-xs text-slate-600">
              Email alerts for deadlines and updates (coming soon)
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500"
          title="Coming soon"
        >
          Subscribe
        </button>
      </div>

      {/* Regulation feed */}
      <div>
        <h2 className={SECTION_HEADING_CLASS}>Regulatory deadlines & changes</h2>
        <p className="mb-4 text-xs text-slate-500">
          Last updated March 2026. This is a static feed for demonstration.
        </p>
        <div className="space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {r.name} — {r.item}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${JURISDICTION_COLORS[r.jurisdiction] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {r.jurisdiction}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${IMPACT_COLORS[r.impact]}`}
                  >
                    {r.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {r.deadline} · {r.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.affectedCount != null && (
                  <span className="text-sm text-slate-600">{r.affectedCount} assets in scope</span>
                )}
                <Link
                  href="/layer3-application/assets"
                  className="text-navy-600 flex items-center gap-1 text-sm hover:underline"
                >
                  View affected assets
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

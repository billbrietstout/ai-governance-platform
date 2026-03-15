/**
 * Regulation Watch – track regulatory changes affecting AI systems.
 */
import Link from "next/link";
import { Bell } from "lucide-react";
import { RegulationFeedClient } from "./RegulationFeedClient";

const REGULATION_ITEMS = [
  {
    id: "eu-ai-act-high-risk",
    name: "EU AI Act",
    item: "High-risk requirements",
    jurisdiction: "EU",
    deadline: "August 2, 2026",
    status: "upcoming",
    impact: "HIGH" as const,
    affectedCount: null as number | null
  },
  {
    id: "eu-ai-act-gpai",
    name: "EU AI Act",
    item: "GPAI model obligations",
    jurisdiction: "EU",
    deadline: "Active since August 2025",
    status: "active",
    impact: "HIGH" as const,
    affectedCount: null
  },
  {
    id: "eu-ai-act-annex1",
    name: "EU AI Act",
    item: "Annex I high-risk (regulated products)",
    jurisdiction: "EU",
    deadline: "August 2027",
    status: "upcoming",
    impact: "MEDIUM" as const,
    affectedCount: null
  },
  {
    id: "sr11-7",
    name: "SR 11-7",
    item: "Updated model risk guidance",
    jurisdiction: "US",
    deadline: "Expected Q3 2026",
    status: "upcoming",
    impact: "HIGH" as const,
    affectedCount: null
  },
  {
    id: "iso-42001",
    name: "ISO 42001",
    item: "Certification wave",
    jurisdiction: "Global",
    deadline: "Ongoing",
    status: "active",
    impact: "MEDIUM" as const,
    affectedCount: null
  },
  {
    id: "nyc-ll144",
    name: "NYC LL144",
    item: "Annual audit cycle",
    jurisdiction: "US",
    deadline: "Ongoing",
    status: "active",
    impact: "MEDIUM" as const,
    affectedCount: null
  },
  {
    id: "dora",
    name: "DORA",
    item: "ICT risk requirements",
    jurisdiction: "EU",
    deadline: "January 2025 (active)",
    status: "active",
    impact: "HIGH" as const,
    affectedCount: null
  },
  {
    id: "colorado-sb21-169",
    name: "Colorado SB21-169",
    item: "Insurance AI",
    jurisdiction: "US",
    deadline: "Active",
    status: "active",
    impact: "LOW" as const,
    affectedCount: null
  }
];

export default async function RegulationFeedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/dashboard" className="text-sm text-navy-600 hover:underline">
          ← Command Center
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Regulation Watch
        </h1>
        <p className="mt-1 text-slate-600">
          Track regulatory changes that affect your AI systems.
        </p>
      </div>

      <RegulationFeedClient items={REGULATION_ITEMS} />
    </main>
  );
}

/**
 * Layer 2 – Information – landing page with metrics and navigation.
 */
import Link from "next/link";
import {
  Database,
  GitBranch,
  FileText,
  MessageSquareWarning,
  Eye,
  Users,
  Shield,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { LayerStackContext } from "@/components/layers/LayerStackContext";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";
import { getLayerMeta } from "@/lib/ui/layer-colors";

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "bg-emerald-100 text-emerald-700",
  INTERNAL: "bg-blue-100 text-blue-700",
  CONFIDENTIAL: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700"
};

const AI_ACCESS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  GOVERNED: "bg-blue-100 text-blue-700",
  RESTRICTED: "bg-amber-100 text-amber-700",
  PROHIBITED: "bg-red-100 text-red-700"
};

const NAV_CARDS = [
  { href: "/layer2-information/master-data", label: "Master Data Registry", icon: Database },
  { href: "/layer2-information/lineage", label: "Data Lineage & ETL", icon: GitBranch },
  { href: "/layer2-information/governance", label: "Data policies", icon: FileText },
  { href: "/layer2-information/classification", label: "Data Classification", icon: Shield },
  { href: "/layer2-information/prompts", label: "Prompt Policies", icon: MessageSquareWarning },
  { href: "/layer2-information/shadow-ai", label: "Shadow AI Detection", icon: Eye }
] as const;

export default async function Layer2InformationPage() {
  const meta = getLayerMeta("LAYER_2_INFORMATION");
  const caller = await createServerCaller();
  const { data } = await caller.layer2.getL2Summary();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <div className="border-l-[3px] pl-4" style={{ borderLeftColor: meta.accentHex }}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Layer 2: Information
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-sm font-medium ${meta.bg} ${meta.border} ${meta.text}`}
            >
              Layer {meta.number} — {meta.shortLabel}
            </span>
          </div>
          <p className="mt-1 text-slate-600">
            Master data, lineage, data policies, and AI-ready data assets.
          </p>
        </div>
        <LayerStackContext activeLayer="LAYER_2_INFORMATION" />
      </div>

      {/* Summary metric cards */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/layer2-information/master-data"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex items-center gap-2">
            <Database className="text-navy-600 h-5 w-5" />
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Total Entities
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.totalEntities}</p>
        </Link>
        <Link
          href="/layer2-information/lineage"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="text-navy-600 h-5 w-5" />
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Lineage Records
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.totalLineage}</p>
        </Link>
        <Link
          href="/layer2-information/governance"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex items-center gap-2">
            <FileText className="text-navy-600 h-5 w-5" />
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Policy library
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.totalPolicies}</p>
        </Link>
        <Link
          href="/layer2-information/governance"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex items-center gap-2">
            <Shield className="text-navy-600 h-5 w-5" />
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Policy coverage
            </span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${complianceTextClass(data.governanceCoveragePct ?? 0)}`}
          >
            {data.governanceCoveragePct ?? 0}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">entities with classification + steward</p>
        </Link>
        {data.overexposureCount != null && data.overexposureCount > 0 && (
          <Link
            href="/layer2-information/master-data?aiAccess=OPEN"
            className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm transition hover:border-red-300 hover:shadow"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Overexposure Risk</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-900">{data.overexposureCount}</p>
            <p className="mt-0.5 text-xs text-red-600">
              RESTRICTED entities with OPEN/GOVERNED access
            </p>
          </Link>
        )}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="text-navy-600 h-5 w-5" />
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Stewardship Coverage
            </span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${complianceTextClass(data.stewardshipPct)}`}>
            {data.stewardshipPct}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">entities with assigned stewards</p>
        </div>
      </div>

      {/* Classification + AI Access — two rows in one panel */}
      <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
        <div className="p-4">
          <h3 className={SECTION_HEADING_CLASS}>Classification</h3>
          <div className="flex flex-wrap gap-2">
            {(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const).map((c) => {
              const count = data.byClassification[c] ?? 0;
              return (
                <span
                  key={c}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${CLASSIFICATION_COLORS[c] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {c} <span className="opacity-70">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="p-4">
          <h3 className={SECTION_HEADING_CLASS}>AI access policy</h3>
          <div className="flex flex-wrap gap-2">
            {(["OPEN", "GOVERNED", "RESTRICTED", "PROHIBITED"] as const).map((p) => {
              const count = data.byAiAccess[p] ?? 0;
              return (
                <span
                  key={p}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${AI_ACCESS_COLORS[p] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {p} <span className="opacity-70">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="rounded-lg border border-slate-200 bg-white">
        {NAV_CARDS.map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-center justify-between px-4 py-3 transition hover:bg-slate-50 ${i < NAV_CARDS.length - 1 ? "border-b border-slate-100" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-navy-500" />
              <span className="text-sm font-medium text-slate-800 transition-colors group-hover:text-navy-600">
                {label}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400" />
          </Link>
        ))}
      </div>

      <LayerSecurityStandardsCard layer="LAYER_2_INFORMATION" />
    </main>
  );
}

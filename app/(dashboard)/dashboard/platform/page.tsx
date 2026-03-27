/**
 * Platform & Ops Overview – for PLATFORM_ENG.
 */
import Link from "next/link";
import { Server, Cpu, AlertTriangle } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";
import { complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

export default async function PlatformDashboardPage() {
  const caller = await createServerCaller();

  const [kpisRes, layerRes] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getLayerPosture()
  ]);

  const kpis = kpisRes.data;
  const layers = layerRes.data;
  const l4 = layers.find((l) => l.layer === "LAYER_4_PLATFORM");
  const l5 = layers.find((l) => l.layer === "LAYER_5_SUPPLY_CHAIN");

  return (
    <PersonaDashboardShell
      title="Platform & Ops Overview"
      subtitle="Telemetry, supply chain, and platform compliance."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/layer4-platform/telemetry"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <Server className="text-navy-600 h-5 w-5" />
            <p
              className={`mt-2 text-2xl font-bold ${complianceTextClass(l4?.compliancePct ?? 0)}`}
            >
              L4 compliance: {l4?.compliancePct ?? 0}%
            </p>
            <p className="text-xs text-slate-500">Platform layer</p>
          </Link>
          <Link
            href="/layer5-supply-chain"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <Cpu className="text-navy-600 h-5 w-5" />
            <p
              className={`mt-2 text-2xl font-bold ${complianceTextClass(l5?.compliancePct ?? 0)}`}
            >
              L5 compliance: {l5?.compliancePct ?? 0}%
            </p>
            <p className="text-xs text-slate-500">Supply chain</p>
          </Link>
          <Link
            href="/layer5-supply-chain/scanning"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.failedScans ?? 0}</p>
            <p className="text-xs text-slate-500">Failed scans</p>
          </Link>
          <Link
            href="/layer5-supply-chain/vendors"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.vendorsExpiring ?? 0}</p>
            <p className="text-xs text-slate-500">Vendors expiring</p>
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>Quick links</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/layer4-platform/telemetry"
              className="text-navy-600 text-sm font-medium hover:underline"
            >
              Telemetry & Monitoring →
            </Link>
            <Link
              href="/layer5-supply-chain/cards"
              className="text-navy-600 text-sm font-medium hover:underline"
            >
              Artifact Cards →
            </Link>
            <Link
              href="/layer5-supply-chain/scanning"
              className="text-navy-600 text-sm font-medium hover:underline"
            >
              Scan Coverage →
            </Link>
          </div>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}

/**
 * Layer 3 – Application – AI asset inventory, accountability, compliance.
 */
import Link from "next/link";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

export default function Layer3ApplicationPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Layer 3: Application
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          AI asset inventory, accountability matrix, and compliance assessments.
        </p>
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Capabilities</h2>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/layer3-application/assets"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
          >
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Asset Inventory
            </div>
            <div className="mt-1 text-sm text-slate-800">Filterable asset table</div>
          </Link>
          <Link
            href="/layer3-application/accountability"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
          >
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Accountability
            </div>
            <div className="mt-1 text-sm text-slate-800">Cross-asset RACI matrix</div>
          </Link>
          <Link
            href="/layer3-application/gaps"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
          >
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Gap Analysis
            </div>
            <div className="mt-1 text-sm text-slate-800">Compliance gaps by asset</div>
          </Link>
          <Link
            href="/assessments"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
          >
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Assessments
            </div>
            <div className="mt-1 text-sm text-slate-800">Assessment workflow</div>
          </Link>
        </div>
      </div>

      <LayerSecurityStandardsCard layer="LAYER_3_APPLICATION" />
    </main>
  );
}

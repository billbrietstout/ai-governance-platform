/**
 * Layer 3 – Application – AI asset inventory, accountability, compliance.
 */
import Link from "next/link";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";

export default function Layer3ApplicationPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Layer 3: Application
        </h1>
        <p className="mt-1 text-slate-600">
          AI asset inventory, accountability matrix, and compliance assessments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/layer3-application/assets"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-medium text-slate-600">Asset Inventory</div>
          <div className="mt-1 text-slate-900">Filterable asset table</div>
        </Link>
        <Link
          href="/layer3-application/accountability"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-medium text-slate-600">Accountability</div>
          <div className="mt-1 text-slate-900">Cross-asset RACI matrix</div>
        </Link>
        <Link
          href="/layer3-application/gaps"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-medium text-slate-600">Gap Analysis</div>
          <div className="mt-1 text-slate-900">Compliance gaps by asset</div>
        </Link>
        <Link
          href="/assessments"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="text-sm font-medium text-slate-600">Assessments</div>
          <div className="mt-1 text-slate-900">Assessment workflow</div>
        </Link>
      </div>

      <LayerSecurityStandardsCard layer="LAYER_3_APPLICATION" />
    </main>
  );
}

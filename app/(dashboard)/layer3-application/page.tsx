/**
 * Layer 3 – Application – AI asset inventory, accountability, compliance.
 */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";
import { getLayerMeta } from "@/lib/ui/layer-colors";

const NAV_ITEMS = [
  { href: "/layer3-application/assets", label: "Asset Inventory", desc: "Filterable asset table" },
  { href: "/layer3-application/accountability", label: "Accountability", desc: "Cross-asset RACI matrix" },
  { href: "/layer3-application/gaps", label: "Gap Analysis", desc: "Compliance gaps by asset" },
  { href: "/assessments", label: "Assessments", desc: "Assessment workflow" }
] as const;

export default function Layer3ApplicationPage() {
  const meta = getLayerMeta("LAYER_3_APPLICATION");

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="border-l-[3px] pl-4" style={{ borderLeftColor: meta.accentHex }}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Layer 3: Application
          </h1>
          <span
            className={`rounded-full border px-3 py-1 text-sm font-medium ${meta.bg} ${meta.border} ${meta.text}`}
          >
            Layer {meta.number} — {meta.shortLabel}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          AI asset inventory, accountability matrix, and compliance assessments.
        </p>
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Capabilities</h2>
        <div className="rounded-lg border border-slate-200 bg-white">
          {NAV_ITEMS.map(({ href, label, desc }, i) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between px-4 py-3 transition hover:bg-slate-50 ${i < NAV_ITEMS.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div>
                <span className="text-sm font-medium text-slate-800 transition-colors group-hover:text-navy-600">
                  {label}
                </span>
                <span className="ml-2 text-sm text-slate-400">{desc}</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400" />
            </Link>
          ))}
        </div>
      </div>

      <LayerSecurityStandardsCard layer="LAYER_3_APPLICATION" />
    </main>
  );
}

import Link from "next/link";
import { getLayerMeta, type CosaiLayerKey } from "@/lib/ui/layer-colors";

export type LayerPosture = {
  layer: CosaiLayerKey;
  maturityLevel: number | null; // 1–5, null = no data
  compliancePct: number | null; // 0–100
  gapCount: number;
  href: string;
};

export function LayerPostureCards({ postures }: { postures: LayerPosture[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
      {postures.map((p) => {
        const meta = getLayerMeta(p.layer);
        const hasData = p.maturityLevel !== null;
        return (
          <Link
            key={p.layer}
            href={p.href}
            className={`group rounded-lg border p-4 transition hover:shadow-md ${meta.bg} ${meta.border}`}
          >
            <div
              className={`text-[10px] font-semibold uppercase tracking-widest ${meta.text} opacity-70`}
            >
              L{meta.number}
            </div>
            <div className={`mt-1 text-sm font-semibold ${meta.text}`}>{meta.shortLabel}</div>
            {hasData ? (
              <>
                <div className={`mt-3 font-mono text-2xl font-semibold tabular-nums ${meta.text}`}>
                  M{p.maturityLevel}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {p.compliancePct !== null ? `${p.compliancePct}% compliant` : "No assessments"}
                </div>
                {p.gapCount > 0 && (
                  <div className="mt-2 text-xs font-medium text-rose-600">
                    {p.gapCount} gap{p.gapCount !== 1 ? "s" : ""}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3 text-xs text-slate-400">Not assessed →</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { getLayerMeta, type CosaiLayerKey } from "@/lib/ui/layer-colors";

const LAYER_HREFS: Record<CosaiLayerKey, string> = {
  LAYER_1_BUSINESS: "/layer1-business",
  LAYER_2_INFORMATION: "/layer2-information",
  LAYER_3_APPLICATION: "/layer3-application/assets",
  LAYER_4_PLATFORM: "/layer4-platform",
  LAYER_5_SUPPLY_CHAIN: "/layer5-supply-chain"
};

const LAYER_ORDER: CosaiLayerKey[] = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export function LayerStackContext({ activeLayer }: { activeLayer: CosaiLayerKey }) {
  return (
    <div className="mb-6 flex items-center gap-1.5 text-xs">
      <span className="mr-1 text-slate-400">Framework position:</span>
      {LAYER_ORDER.map((key, i) => {
        const meta = getLayerMeta(key);
        const isActive = key === activeLayer;
        return (
          <div key={key} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">›</span>}
            {isActive ? (
              <span
                className={`rounded border px-2 py-0.5 font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
              >
                L{meta.number} {meta.shortLabel}
              </span>
            ) : (
              <Link
                href={LAYER_HREFS[key]}
                className="text-slate-400 hover:text-slate-600 hover:underline"
              >
                L{meta.number}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

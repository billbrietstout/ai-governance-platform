"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLayerMeta, type CosaiLayerKey } from "@/lib/ui/layer-colors";

const LAYER_PATHS: Array<{ key: CosaiLayerKey; prefix: string; href: string }> = [
  { key: "LAYER_1_BUSINESS", prefix: "/layer1-business", href: "/layer1-business" },
  { key: "LAYER_2_INFORMATION", prefix: "/layer2-information", href: "/layer2-information" },
  {
    key: "LAYER_3_APPLICATION",
    prefix: "/layer3-application",
    href: "/layer3-application/assets"
  },
  { key: "LAYER_4_PLATFORM", prefix: "/layer4-platform", href: "/layer4-platform" },
  { key: "LAYER_5_SUPPLY_CHAIN", prefix: "/layer5-supply-chain", href: "/layer5-supply-chain" }
];

export function LayerContextStrip() {
  const pathname = usePathname();
  const activeLayer = LAYER_PATHS.find((l) => pathname.startsWith(l.prefix));

  // Only render when the user is inside a layer section
  if (!activeLayer) return null;

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-1.5">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto">
        {LAYER_PATHS.map((layer, i) => {
          const meta = getLayerMeta(layer.key);
          const isActive = layer.key === activeLayer.key;
          return (
            <div key={layer.key} className="flex items-center gap-1">
              {i > 0 && <span className="text-xs text-slate-300">›</span>}
              <Link
                href={layer.href}
                className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium transition ${
                  isActive
                    ? `${meta.bg} ${meta.text} ${meta.border} border`
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                L{meta.number} {meta.shortLabel}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getLayerMeta, LAYER_META, type CosaiLayerKey } from "@/lib/ui/layer-colors";

const LAYERS = Object.keys(LAYER_META) as CosaiLayerKey[];

export function FrameworkWelcomeBanner() {
  return (
    <div className="mb-6 rounded-xl border border-navy-200 bg-navy-50 p-6">
      <h2 className="text-lg font-semibold text-navy-900">
        Welcome to your AI governance platform
      </h2>
      <p className="mt-1 text-sm text-navy-700 max-w-2xl">
        Your governance posture is organized across five CoSAI layers. Accountability flows from business
        strategy downward — set your Layer 1 policy first.
      </p>

      {/* Mini stack — horizontal chips showing hierarchy */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {LAYERS.map((key, i) => {
          const meta = getLayerMeta(key);
          return (
            <div key={key} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-sm text-navy-300">→</span>}
              <Link
                href={
                  key === "LAYER_1_BUSINESS"
                    ? "/layer1-business"
                    : key === "LAYER_2_INFORMATION"
                      ? "/layer2-information"
                      : key === "LAYER_3_APPLICATION"
                        ? "/layer3-application/assets"
                        : key === "LAYER_4_PLATFORM"
                          ? "/layer4-platform"
                          : "/layer5-supply-chain"
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition hover:shadow-sm ${meta.bg} ${meta.border} ${meta.text}`}
              >
                L{meta.number} · {meta.shortLabel}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href="/layer1-business"
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
        >
          Start with Layer 1 →
        </Link>
        <Link href="/dashboard" className="text-sm text-navy-600 hover:underline">
          Explore dashboard
        </Link>
      </div>
    </div>
  );
}

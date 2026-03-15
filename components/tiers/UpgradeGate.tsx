"use client";

import Link from "next/link";
import { Lock, ArrowRight, Briefcase } from "lucide-react";
import {
  canAccessFeature,
  getFeatureLabel,
  getFeatureTier,
  getOtherFeaturesInTier,
  type GatedFeature
} from "@/lib/tiers/gates";

type Props = {
  feature: GatedFeature;
  tier: "PRO" | "CONSULTANT" | "ENTERPRISE";
  userTier: string;
  children?: React.ReactNode;
};

export function UpgradeGate({ feature, tier, userTier, children }: Props) {
  if (canAccessFeature(userTier, feature)) {
    return <>{children}</>;
  }
  const label = getFeatureLabel(feature);
  const requiredTier = getFeatureTier(feature);
  const otherFeatures = getOtherFeaturesInTier(feature, 3);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
          <p className="mt-1 text-sm text-slate-600">
            This feature is available on the {requiredTier} tier. Upgrade to unlock full access.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/settings/billing?upgrade=pro"
              className="inline-flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
            >
              Upgrade to {requiredTier}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/settings?tab=consultant"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4" />
              Talk to a consultant
            </Link>
          </div>
          {otherFeatures.length > 0 && (
            <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-medium text-slate-500">
                You&apos;ll also unlock:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {otherFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                    {getFeatureLabel(f)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

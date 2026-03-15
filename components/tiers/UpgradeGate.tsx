"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { tierMeets, type OrgTier } from "@/lib/tiers/tier-utils";

export interface UpgradeGateProps {
  feature: string;
  requiredTier: "PRO" | "CONSULTANT" | "ENTERPRISE";
  description: string;
  unlockedBy: string[];
  orgTier: OrgTier;
  children: React.ReactNode;
}

export function UpgradeGate({
  feature,
  requiredTier,
  description,
  unlockedBy,
  orgTier,
  children
}: UpgradeGateProps) {
  if (tierMeets(orgTier, requiredTier)) {
    return <>{children}</>;
  }

  const tierLabel = requiredTier === "PRO" ? "Pro" : requiredTier === "CONSULTANT" ? "Consultant" : "Enterprise";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{feature}</h2>
        <p className="mt-1 text-slate-600">{description}</p>
        <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Available in {tierLabel} plan
        </span>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">What you unlock:</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {unlockedBy.slice(0, 3).map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-500"
          >
            Upgrade to {tierLabel}
          </Link>
          <a
            href="mailto:contact@aiposture.com?subject=Consultant%20inquiry"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Talk to a consultant
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Need help deciding? Book a free 30-min assessment call.
        </p>
      </div>
    </div>
  );
}

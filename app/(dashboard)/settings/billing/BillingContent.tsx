"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type BillingContentProps = {
  tier: string;
  assetCount: number;
  assetLimit: number;
  userCount: number;
  usersLimit: number;
  trialEndsAt: Date | null;
};

const TIER_LABEL: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  CONSULTANT: "Consultant",
  ENTERPRISE: "Enterprise"
};

export function BillingContent({
  tier,
  assetCount,
  assetLimit,
  userCount,
  usersLimit,
  trialEndsAt
}: BillingContentProps) {
  const searchParams = useSearchParams();
  const upgradePro = searchParams.get("upgrade") === "pro";
  const proCardRef = useRef<HTMLDivElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (upgradePro && proCardRef.current) {
      proCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [upgradePro]);

  const handleUpgradePro = useCallback(() => {
    setShowUpgradeModal(true);
  }, []);

  const tierUpper = tier.toUpperCase();

  return (
    <>
      {/* Upgrade banner when ?upgrade=pro */}
      {upgradePro && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You tried to access a Pro feature. Upgrade to unlock it.
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Current plan</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              tierUpper === "FREE"
                ? "bg-gray-100 text-gray-700"
                : tierUpper === "PRO"
                  ? "bg-navy-100 text-navy-700"
                  : tierUpper === "CONSULTANT"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {TIER_LABEL[tierUpper] ?? tier}
          </span>
          <span className="text-sm text-gray-600">
            {assetCount}/{assetLimit} assets used
          </span>
          <span className="text-sm text-gray-600">
            {userCount}/{usersLimit} users
          </span>
          {trialEndsAt && trialEndsAt > new Date() && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Trial ends {trialEndsAt.toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {tierUpper === "FREE" ? "Free forever" : "Your plan renews on the 1st of each month."}
        </p>
      </div>

      {/* Upgrade options */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Upgrade options</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {/* FREE */}
          <div
            className={`rounded-xl border p-6 ${
              tierUpper === "FREE"
                ? "border-navy-300 bg-navy-50/30"
                : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <h3 className="text-base font-semibold text-gray-900">Free</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900">$0</div>
            <p className="mt-2 text-sm text-gray-600">Get started with AI readiness</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Up to {assetLimit} AI assets</li>
              <li>• Up to {usersLimit} users</li>
              <li>• Regulation Discovery</li>
              <li>• Basic maturity scoring</li>
            </ul>
            <div className="mt-6">
              <span className="block w-full rounded-lg border border-gray-200 bg-gray-100 py-2.5 text-center text-sm font-medium text-gray-500">
                {tierUpper === "FREE" ? "Your current plan" : "Downgrade"}
              </span>
            </div>
          </div>

          {/* PRO */}
          <div
            ref={proCardRef}
            className={`relative rounded-xl border p-6 ${
              upgradePro
                ? "border-navy-500 bg-navy-50/50 ring-navy-400 animate-pulse shadow-lg ring-2 ring-offset-2"
                : "border-navy-200 bg-white shadow-sm"
            }`}
          >
            <span className="bg-navy-600 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-medium text-white">
              Most popular
            </span>
            <h3 className="text-base font-semibold text-gray-900">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">$49</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Up to 500 AI assets</li>
              <li>• Up to 25 users</li>
              <li>• Compliance snapshots & trends</li>
              <li>• Audit packages & evidence workbook</li>
              <li>• ISO 42001 & EU AI Act tracking</li>
              <li>• Readiness reports</li>
            </ul>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleUpgradePro}
                className="bg-navy-600 hover:bg-navy-500 focus:ring-navy-500 w-full rounded-lg py-2.5 text-sm font-medium text-white transition focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Upgrade to Pro
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">or $490/year — save 2 months</p>
            </div>
          </div>

          {/* CONSULTANT */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Consultant</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">$199</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">For advisory firms and consultants</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Everything in Pro</li>
              <li>• Up to 50 client workspaces</li>
              <li>• White-label branding</li>
              <li>• Client report generation</li>
              <li>• Priority support</li>
            </ul>
            <div className="mt-6">
              <a
                href="mailto:hello@aiposture.io?subject=Consultant%20plan%20inquiry"
                className="block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Need help choosing */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Need help choosing?</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a
            href="mailto:hello@aiposture.io?subject=Free%2030-min%20assessment%20call"
            className="text-navy-600 hover:underline"
          >
            Book a free 30-min assessment call
          </a>
          <a
            href="mailto:hello@aiposture.io?subject=Talk%20to%20our%20team"
            className="text-navy-600 hover:underline"
          >
            Talk to our team
          </a>
          <a
            href="https://coalitionforsecureai.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy-600 hover:underline"
          >
            Read the CoSAI framework documentation
          </a>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowUpgradeModal(false)}
            aria-hidden
          />
          <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Upgrade to Pro</h3>
            <p className="mt-2 text-sm text-gray-600">
              Payment processing coming soon. Contact us at{" "}
              <a
                href="mailto:hello@aiposture.io?subject=Upgrade%20to%20Pro"
                className="text-navy-600 font-medium hover:underline"
              >
                hello@aiposture.io
              </a>{" "}
              to upgrade.
            </p>
            <p className="mt-2 text-sm text-gray-600">We&apos;ll get you set up within 24 hours.</p>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="bg-navy-600 hover:bg-navy-500 mt-6 w-full rounded-lg py-2.5 text-sm font-medium text-white"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </>
  );
}

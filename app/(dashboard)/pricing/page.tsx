/**
 * Pricing – tier comparison and upgrade.
 */
import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: null,
    description: "Get started with AI readiness",
    features: [
      "AI Readiness Assessment (M1–M2)",
      "Regulation Discovery",
      "Use Case Library",
      "Up to 10 AI assets",
      "Basic maturity scoring"
    ],
    cta: "Current plan",
    ctaHref: null,
    highlighted: false
  },
  {
    name: "Pro",
    price: 49,
    period: "mo",
    description: "Full governance for growing teams",
    features: [
      "Everything in Free, plus:",
      "Full governance (M3–M5)",
      "Unlimited AI assets",
      "Compliance snapshots & trends",
      "Audit packages & evidence workbook",
      "ISO 42001 & EU AI Act tracking",
      "Governance reports",
      "Team collaboration (up to 10 users)"
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/settings/billing?upgrade=pro",
    highlighted: true
  },
  {
    name: "Consultant",
    price: 199,
    period: "mo",
    description: "For consultants serving multiple clients",
    features: [
      "Everything in Pro, plus:",
      "Multiple client workspaces",
      "White-label branding",
      "Client report generation",
      "Bulk assessment tools",
      "Priority support",
      "Unlimited users"
    ],
    cta: "Contact sales",
    ctaHref: "mailto:contact@aiposture.com?subject=Consultant%20plan%20inquiry",
    highlighted: false
  }
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-10 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Plans & Pricing</h1>
        <p className="mt-2 text-slate-600">
          Choose the plan that fits your AI governance needs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-xl border p-6 ${
              tier.highlighted
                ? "border-navy-500 bg-navy-50/50 shadow-lg"
                : "border-slate-200 bg-white"
            }`}
          >
            {tier.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-600 px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-900">{tier.name}</h2>
            <div className="mt-1 flex items-baseline gap-1">
              {tier.price != null ? (
                <>
                  <span className="text-2xl font-bold text-slate-900">${tier.price}</span>
                  <span className="text-slate-500">/{tier.period}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-slate-900">$0</span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {tier.ctaHref ? (
                <Link
                  href={tier.ctaHref}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                    tier.highlighted
                      ? "bg-navy-600 text-white hover:bg-navy-500"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              ) : (
                <span className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-center text-sm font-medium text-slate-500">
                  {tier.cta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500">
        Need help deciding?{" "}
        <a
          href="mailto:contact@aiposture.com?subject=Free%2030-min%20assessment"
          className="text-navy-600 hover:underline"
        >
          Book a free 30-min assessment call
        </a>
      </p>
    </main>
  );
}

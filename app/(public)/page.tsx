/**
 * Public landing page – AI readiness and governance platform.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Search,
  Briefcase,
  Building2,
  Check,
  Shield,
  Layers,
  FileText,
  Database,
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Zap
} from "lucide-react";

const TRUST_BADGES = [
  "CoSAI Framework",
  "EU AI Act Ready",
  "ISO 42001 Aligned",
  "NIST AI RMF"
];

const FREE_FEATURES = [
  { label: "AI Readiness Assessment (M1-M2)", icon: BarChart3 },
  { label: "Regulation Discovery (up to 10 saved assessments)", icon: Search },
  { label: "AI Use Case Library (read-only)", icon: FileText },
  { label: "Operating Model Selector", icon: Layers },
  { label: "Basic asset inventory (up to 10 assets)", icon: Database },
  { label: "Maturity score with next steps", icon: TrendingUp }
];

const PRO_FEATURES = [
  { label: "Full five-layer accountability (M3-M5)", icon: Layers },
  { label: "Up to 500 AI assets", icon: Database },
  { label: "Audit packages and evidence workbook", icon: Package },
  { label: "Compliance snapshots", icon: FileText },
  { label: "Team collaboration", icon: Users },
  { label: "API access", icon: Zap }
];

const COSAI_LAYERS = [
  { id: "L1", name: "Business", desc: "Strategy, governance, accountability" },
  { id: "L2", name: "Information", desc: "Data, lineage, classification" },
  { id: "L3", name: "Application", desc: "AI assets, lifecycle, controls" },
  { id: "L4", name: "Platform", desc: "Infrastructure, monitoring, ops" },
  { id: "L5", name: "Supply Chain", desc: "Vendors, provenance, risk" }
];

export default async function PublicLandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Is your company prepared to deploy AI?
          </h1>
          <p className="mt-6 text-xl text-slate-600">
            The only platform built on the CoSAI Shared Responsibility Framework — assess
            readiness, discover regulations, and build governance that satisfies auditors
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/discover/wizard"
                className="rounded-lg bg-navy-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-navy-500"
              >
                Assess my AI readiness →
              </Link>
              <Link
                href="#framework"
                className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                See the framework
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-navy-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Persona cards */}
      <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            How are you approaching AI readiness?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Link
              href="/discover/wizard"
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-navy-300 hover:shadow-md"
            >
              <Search className="h-10 w-10 text-navy-600" />
              <h3 className="mt-4 font-semibold text-slate-900">
                I&apos;m evaluating AI adoption
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Start the regulation discovery wizard — no login required for the first 3 steps.
                Identify which regulations apply to your planned AI system.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-navy-600 group-hover:underline">
                Start free →
              </span>
            </Link>
            <Link
              href="/login?callbackUrl=/onboarding&consultant=1"
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-navy-300 hover:shadow-md"
            >
              <Briefcase className="h-10 w-10 text-navy-600" />
              <h3 className="mt-4 font-semibold text-slate-900">
                I&apos;m a consultant or advisor
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Access the consultant workspace with multiple client workspaces and
                white-label branding.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-navy-600 group-hover:underline">
                Consultant signup →
              </span>
            </Link>
            <Link
              href="/login?callbackUrl=/onboarding&vendor=1"
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-navy-300 hover:shadow-md"
            >
              <Building2 className="h-10 w-10 text-navy-600" />
              <h3 className="mt-4 font-semibold text-slate-900">
                I&apos;m a vendor or platform provider
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Partner inquiry — manage your AI assurance posture and compliance
                documentation.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-navy-600 group-hover:underline">
                Partner inquiry →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* What you get free */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            What you get free
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_FEATURES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
              >
                <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-slate-900">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's in Pro */}
      <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            What&apos;s in Pro
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_FEATURES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg border border-navy-200 bg-navy-50/30 p-4"
              >
                <Icon className="h-5 w-5 shrink-0 text-navy-600" />
                <span className="text-sm font-medium text-slate-900">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CoSAI framework */}
      <section id="framework" className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            The CoSAI five-layer model
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Accountability flows from business strategy down through data, applications, platform,
            and supply chain. Each layer depends on the one above.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {COSAI_LAYERS.map((layer) => (
              <div
                key={layer.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="font-semibold text-slate-900">{layer.id}</div>
                <div className="text-sm text-slate-600">{layer.name}</div>
                <div className="mt-1 text-xs text-slate-500">{layer.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="https://coalitionforsecureai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-navy-600 hover:underline"
            >
              <Shield className="h-4 w-4" />
              Learn more about CoSAI
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

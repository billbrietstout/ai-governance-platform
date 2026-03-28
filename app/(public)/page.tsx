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

const TRUST_BADGES = ["CoSAI Framework", "EU AI Act Ready", "ISO 42001 Aligned", "NIST AI RMF"];

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
      <section className="public-hero-section relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:px-6 lg:py-28">
        <div className="public-hero-inner mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Is your company prepared to deploy AI?
          </h1>
          <p className="mt-6 text-xl text-slate-600">
            The only platform built on the CoSAI Shared Responsibility Framework — assess readiness,
            discover regulations, and build governance that satisfies auditors
          </p>
          <div className="public-hero-cta-stack mt-10 flex flex-col items-center justify-center space-y-4">
            <div className="public-hero-cta-row">
              <Link href="/discover/wizard" className="public-btn-primary">
                Assess my AI readiness →
              </Link>
              <Link href="#framework" className="public-btn-secondary">
                See the framework
              </Link>
            </div>
            <p className="public-signin-hint text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-navy-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <div className="public-trust-badge-row mt-12">
            {TRUST_BADGES.map((badge) => (
              <span key={badge} className="public-trust-badge">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Persona cards */}
      <section className="public-section-pad border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="public-max-w-5xl mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            How are you approaching AI readiness?
          </h2>
          <div className="public-persona-grid mt-10 grid gap-6 sm:grid-cols-3">
            <Link href="/discover/wizard" className="public-persona-card group">
              <Search className="text-navy-600 h-10 w-10" />
              <h3>I&apos;m evaluating AI adoption</h3>
              <p>
                Start the regulation discovery wizard — no login required for the first 3 steps.
                Identify which regulations apply to your planned AI system.
              </p>
              <span className="public-persona-more group-hover:underline">Start free →</span>
            </Link>
            <Link
              href="/login?callbackUrl=/onboarding&consultant=1"
              className="public-persona-card group"
            >
              <Briefcase className="text-navy-600 h-10 w-10" />
              <h3>I&apos;m a consultant or advisor</h3>
              <p>
                Access the consultant workspace with multiple client workspaces and white-label
                branding.
              </p>
              <span className="public-persona-more group-hover:underline">Consultant signup →</span>
            </Link>
            <Link
              href="/login?callbackUrl=/onboarding&vendor=1"
              className="public-persona-card group"
            >
              <Building2 className="text-navy-600 h-10 w-10" />
              <h3>I&apos;m a vendor or platform provider</h3>
              <p>
                Partner inquiry — manage your AI assurance posture and compliance documentation.
              </p>
              <span className="public-persona-more group-hover:underline">Partner inquiry →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* What you get free */}
      <section className="public-section-pad border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="public-max-w-5xl mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">What you get free</h2>
          <div className="public-feature-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_FEATURES.map(({ label, icon: Icon }) => (
              <div key={label} className="public-feature-row">
                <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's in Pro */}
      <section className="public-section-pad border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="public-max-w-5xl mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">What&apos;s in Pro</h2>
          <div className="public-feature-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_FEATURES.map(({ label, icon: Icon }) => (
              <div key={label} className="public-feature-row public-feature-pro">
                <Icon className="text-navy-600 h-5 w-5 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CoSAI framework */}
      <section
        id="framework"
        className="public-section-pad border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6"
      >
        <div className="public-max-w-3xl mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            The CoSAI five-layer model
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-600">
            Accountability flows from business strategy downward. Each layer is constrained by the
            policy set in the layers above it.
          </p>

          {/* Vertical stack — each layer slightly narrower than the one above */}
          <div className="public-framework-stack mt-10 flex w-full flex-col items-stretch gap-0">
            {COSAI_LAYERS.map((layer, i) => {
              const widthPct = 100 - i * 6; // 100%, 94%, 88%, 82%, 76%
              const layerTone = `public-layer-l${i + 1}` as const;
              return (
                <div
                  key={layer.id}
                  className="public-framework-layer-row flex w-full flex-col items-center"
                >
                  {i > 0 && (
                    // Connector arrow between layers
                    <div className="public-framework-connector flex h-5 w-px flex-col items-center justify-center">
                      <div className="h-4 w-px bg-slate-300" />
                      <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-slate-300" />
                    </div>
                  )}
                  <div
                    className={`public-layer-card ${layerTone} box-border w-full max-w-full px-5 py-4`}
                    style={{ maxWidth: `${widthPct}%` }}
                  >
                    <div className="public-framework-layer-card-inner flex items-center justify-between">
                      <div>
                        <span className="public-layer-id">{layer.id}</span>
                        <div className="public-layer-title">{layer.name}</div>
                        <div className="public-layer-desc">{layer.desc}</div>
                      </div>
                      {i > 0 && (
                        <div className="public-layer-governed ml-4">governed by L{i}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="public-cta-row-wrap mt-8 flex justify-center">
            <a
              href="https://coalitionforsecureai.org"
              target="_blank"
              rel="noopener noreferrer"
              className="public-coai-footer-link text-navy-600 inline-flex items-center space-x-2 text-sm font-medium hover:underline"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Learn more about CoSAI</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

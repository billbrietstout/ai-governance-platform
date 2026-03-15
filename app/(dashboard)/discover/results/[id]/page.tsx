/**
 * Regulation Discovery Results – view saved discovery with regulations and controls.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, PlusCircle } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { RegulationChordDiagram } from "@/components/discovery/RegulationChordDiagram";
import { SharedControlsSummary } from "@/components/discovery/SharedControlsSummary";

const APPLICABILITY_COLORS: Record<string, string> = {
  MANDATORY: "bg-red-100 text-red-800 border-red-200",
  LIKELY_APPLICABLE: "bg-amber-100 text-amber-800 border-amber-200",
  RECOMMENDED: "bg-blue-100 text-blue-800 border-blue-200"
};

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

export default async function DiscoveryResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();
  let discovery;
  try {
    const res = await caller.discovery.getDiscovery({ id });
    discovery = res.data;
  } catch {
    notFound();
  }

  const results = discovery.results as {
    mandatory?: { code: string; name: string; jurisdiction: string; applicability: string; keyRequirements: string; deadline?: string; implementationEffort: string }[];
    likelyApplicable?: { code: string; name: string; jurisdiction: string; applicability: string; keyRequirements: string; deadline?: string; implementationEffort: string }[];
    recommended?: { code: string; name: string; jurisdiction: string; applicability: string; keyRequirements: string; deadline?: string; implementationEffort: string }[];
    requiredControls?: { controlId: string; title: string; cosaiLayer: string; complianceStatus?: string }[];
    estimatedMaturityRequired?: number;
    riskScore?: number;
  };

  const mandatory = results?.mandatory ?? [];
  const likelyApplicable = results?.likelyApplicable ?? [];
  const recommended = results?.recommended ?? [];
  const requiredControls = results?.requiredControls ?? [];

  const applicableRegulations = [...mandatory, ...likelyApplicable].map((r) => ({
    code: r.code,
    name: r.name,
    jurisdiction: r.jurisdiction,
    applicability: r.applicability,
    mandatory: r.applicability === "MANDATORY"
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Discovery Results</h1>
          <p className="mt-1 text-slate-600">
            {discovery.asset?.name
              ? `Regulations for ${discovery.asset.name}`
              : `Run from ${new Date(discovery.createdAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/layer3-application/assets/new?fromDiscovery=${id}`}
            className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
          >
            <PlusCircle className="h-4 w-4" />
            Create Asset from this discovery
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled
            title="Coming soon"
          >
            <FileDown className="h-4 w-4" />
            Export as PDF
          </button>
        </div>
      </div>

      {/* Risk score & maturity */}
      {(results?.riskScore != null || results?.estimatedMaturityRequired != null) && (
        <div className="flex gap-4">
          {results.riskScore != null && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-600">Risk score</span>
              <p className="text-xl font-bold text-slate-900">{results.riskScore}/100</p>
            </div>
          )}
          {results.estimatedMaturityRequired != null && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-600">Estimated maturity required</span>
              <p className="text-xl font-bold text-slate-900">M{results.estimatedMaturityRequired}</p>
            </div>
          )}
        </div>
      )}

      {/* Regulatory overlap — chord diagram + shared controls */}
      {applicableRegulations.length >= 2 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Regulatory overlap — implement once, satisfy many
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <RegulationChordDiagram regulations={applicableRegulations} />
            </div>
            <SharedControlsSummary regulations={applicableRegulations} />
          </div>
        </div>
      ) : applicableRegulations.length === 1 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Single regulation summary</h2>
          <p className="mt-2 text-sm text-slate-600">
            One applicable regulation ({applicableRegulations[0]?.name}) — no overlap analysis needed.
          </p>
        </div>
      ) : null}

      {/* Regulations by applicability */}
      <div className="space-y-6">
        {mandatory.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-slate-700">
              MANDATORY — must comply
            </h3>
            <ul className="space-y-3">
              {mandatory.map((r) => (
                <li key={r.code} className="rounded border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`rounded border px-2 py-0.5 text-xs font-medium ${APPLICABILITY_COLORS.MANDATORY}`}>
                        MANDATORY
                      </span>
                      <h4 className="mt-1 font-medium text-slate-900">{r.name}</h4>
                      <p className="text-xs text-slate-500">{r.jurisdiction}</p>
                      <p className="mt-1 text-sm text-slate-700">{r.keyRequirements}</p>
                      {r.deadline && (
                        <p className="mt-1 text-xs text-amber-600">Deadline: {r.deadline}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {r.implementationEffort} effort
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {likelyApplicable.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-slate-700">
              LIKELY APPLICABLE — assess further
            </h3>
            <ul className="space-y-3">
              {likelyApplicable.map((r) => (
                <li key={r.code} className="rounded border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`rounded border px-2 py-0.5 text-xs font-medium ${APPLICABILITY_COLORS.LIKELY_APPLICABLE}`}>
                        LIKELY APPLICABLE
                      </span>
                      <h4 className="mt-1 font-medium text-slate-900">{r.name}</h4>
                      <p className="text-xs text-slate-500">{r.jurisdiction}</p>
                      <p className="mt-1 text-sm text-slate-700">{r.keyRequirements}</p>
                      {r.deadline && (
                        <p className="mt-1 text-xs text-amber-600">Deadline: {r.deadline}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {r.implementationEffort} effort
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-slate-700">
              RECOMMENDED — best practice
            </h3>
            <ul className="space-y-3">
              {recommended.map((r) => (
                <li key={r.code} className="rounded border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`rounded border px-2 py-0.5 text-xs font-medium ${APPLICABILITY_COLORS.RECOMMENDED}`}>
                        RECOMMENDED
                      </span>
                      <h4 className="mt-1 font-medium text-slate-900">{r.name}</h4>
                      <p className="text-xs text-slate-500">{r.jurisdiction}</p>
                      <p className="mt-1 text-sm text-slate-700">{r.keyRequirements}</p>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {r.implementationEffort} effort
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Required Controls */}
      {requiredControls.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Required Controls</h3>
          <p className="mb-3 text-xs text-slate-500">
            Controls needed, mapped to CoSAI layers. Compliance status shown when linked to an asset.
          </p>
          <ul className="space-y-2">
            {requiredControls.map((c) => (
              <li
                key={c.controlId}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-slate-900">{c.title}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {LAYER_LABELS[c.cosaiLayer] ?? c.cosaiLayer}
                  </span>
                </div>
                {c.complianceStatus && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {c.complianceStatus}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

    </main>
  );
}

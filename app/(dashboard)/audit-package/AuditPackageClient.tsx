"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Scale, Calendar, FileDown } from "lucide-react";
import { getAuditPackagePreview } from "./actions";
import { AuditPackageActions } from "./AuditPackageActions";

type Asset = { id: string; name: string; euRiskLevel: string | null };
type Regulation = { value: string; label: string };

const RISK_COLORS: Record<string, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  UNACCEPTABLE: "bg-red-100 text-red-700"
};

function ExportPDFButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/export/audit-package");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-readiness-audit-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
    >
      <FileDown className="h-4 w-4" />
      {loading ? "Generating PDF…" : "Export as PDF"}
    </button>
  );
}

type Props = { assets: Asset[]; regulations: Regulation[] };

export function AuditPackageClient({ assets, regulations }: Props) {
  const [mode, setMode] = useState<"asset" | "regulation">("asset");
  const [assetId, setAssetId] = useState("");
  const [regulationCode, setRegulationCode] = useState("");
  const [preview, setPreview] = useState<{
    evidenceCounts: Record<string, number>;
    coverageScore: number;
    missingItems: { id: string; name: string; layer: string; howToCollect: string; link: string }[];
    totalRequired: number;
    presentCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    const id = mode === "asset" ? assetId : undefined;
    const reg = mode === "regulation" ? regulationCode : undefined;
    if (!id && !reg) return;
    setLoading(true);
    try {
      const data = await getAuditPackagePreview({
        assetId: id || undefined,
        regulationCode: reg || undefined
      });
      setPreview({
        evidenceCounts: data.evidenceCounts,
        coverageScore: data.coverageScore,
        missingItems: data.missingItems,
        totalRequired: data.totalRequired,
        presentCount: data.presentCount
      });
    } catch (e) {
      console.error(e);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const canLoadPreview = (mode === "asset" && assetId) || (mode === "regulation" && regulationCode);

  return (
    <div className="space-y-6">
      {/* Full audit package PDF export */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-slate-900">Full Audit Package (PDF)</h3>
            <p className="mt-1 text-sm text-slate-600">
              Export complete org-wide audit package for regulators and auditors.
            </p>
          </div>
          <ExportPDFButton />
        </div>
      </div>

      {/* Export mode cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => { setMode("asset"); setPreview(null); }}
          className={`flex items-center gap-4 rounded-lg border p-6 text-left shadow-sm transition ${
            mode === "asset" ? "border-navy-500 bg-navy-50 ring-2 ring-navy-500" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-navy-100">
            <Package className="h-7 w-7 text-navy-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">By Asset</h2>
            <p className="mt-1 text-sm text-slate-600">
              Select an AI asset and export all evidence for that asset.
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => { setMode("regulation"); setPreview(null); }}
          className={`flex items-center gap-4 rounded-lg border p-6 text-left shadow-sm transition ${
            mode === "regulation" ? "border-navy-500 bg-navy-50 ring-2 ring-navy-500" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Scale className="h-7 w-7 text-slate-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">By Regulation</h2>
            <p className="mt-1 text-sm text-slate-600">
              Select a regulation/framework and export all evidence across assets.
            </p>
          </div>
        </button>
      </div>

      {/* Selectors */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {mode === "asset" ? (
          <div>
            <label htmlFor="asset-select" className="block text-sm font-medium text-slate-700">
              Asset
            </label>
            <select
              id="asset-select"
              value={assetId}
              onChange={(e) => { setAssetId(e.target.value); setPreview(null); }}
              className="mt-1 min-w-[280px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">— Select an asset —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.euRiskLevel ? ` (${a.euRiskLevel})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="regulation-select" className="block text-sm font-medium text-slate-700">
              Regulation / Framework
            </label>
            <select
              id="regulation-select"
              value={regulationCode}
              onChange={(e) => { setRegulationCode(e.target.value); setPreview(null); }}
              className="mt-1 min-w-[280px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">— Select regulation —</option>
              {regulations.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          onClick={loadPreview}
          disabled={!canLoadPreview || loading}
          className="mt-4 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Preview evidence"}
        </button>
      </div>

      {/* Evidence preview panel */}
      {preview && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-700">Evidence preview</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Control attestations</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.controlAttestations}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Scan records</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.scanRecords}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Accountability assignments</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.accountabilityAssignments}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Vendor assurance</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.vendorAssurances}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Artifact / model cards</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.artifactCards}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Governance policies</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.governancePolicies}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Maturity assessment</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.maturityAssessment ? "Yes" : "No"}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">Data lineage records</span>
              <p className="text-lg font-semibold text-slate-900">{preview.evidenceCounts.lineageRecords}</p>
            </div>
          </div>

          {/* Coverage score */}
          <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Coverage score: </span>
            <span className={`text-lg font-bold ${preview.coverageScore >= 80 ? "text-emerald-600" : preview.coverageScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {preview.coverageScore}%
            </span>
            <span className="text-sm text-slate-600">
              {" "}({preview.presentCount} of {preview.totalRequired} required items present)
            </span>
          </div>

          {/* Missing evidence */}
          {preview.missingItems.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-700">Missing evidence</h4>
              <ul className="space-y-2">
                {preview.missingItems.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-900">{m.name}</span>
                    <span className="text-xs text-slate-500">L{m.layer.slice(1)}</span>
                    <Link href={m.link} className="text-navy-600 hover:underline">
                      Add →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
            <AuditPackageActions
              assetId={mode === "asset" && assetId ? assetId : undefined}
              regulationCode={mode === "regulation" && regulationCode ? regulationCode : undefined}
            />
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-500"
              title="Coming in Phase 8"
            >
              <Calendar className="h-4 w-4" />
              Schedule recurring export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

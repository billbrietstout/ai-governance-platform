"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, AlertTriangle, Check, X } from "lucide-react";
import { addProvenanceRecord } from "./actions";

type ProvenanceRecord = {
  id: string;
  vendorId: string;
  modelName: string;
  stepType: string;
  description: string | null;
  responsibleParty: string | null;
  attestation: boolean;
  attestationDetails: string | null;
  occurredAt: Date | null;
  vendor: { vendorName: string };
};

type Vendor = { id: string; vendorName: string };

type Props = {
  initialRecords: ProvenanceRecord[];
  vendors: Vendor[];
  highRiskAssetCount: number;
};

const STEP_ORDER = ["TRAINING_DATA", "BASE_MODEL", "FINE_TUNING", "DEPLOYMENT"];
const STEP_LABELS: Record<string, string> = {
  TRAINING_DATA: "Training data",
  BASE_MODEL: "Base model",
  FINE_TUNING: "Fine-tuning",
  DEPLOYMENT: "Deployed version"
};

export function ProvenanceClient({
  initialRecords,
  vendors,
  highRiskAssetCount
}: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [vendorFilter, setVendorFilter] = useState("");
  const [form, setForm] = useState<{
    vendorId: string;
    modelName: string;
    stepType: "TRAINING_DATA" | "BASE_MODEL" | "FINE_TUNING" | "DEPLOYMENT";
    description: string;
    responsibleParty: string;
    attestation: boolean;
    occurredAt: string;
  }>({
    vendorId: "",
    modelName: "",
    stepType: "TRAINING_DATA",
    description: "",
    responsibleParty: "",
    attestation: false,
    occurredAt: ""
  });
  const [saving, setSaving] = useState(false);

  const DELIM = "\x00";
  const byVendorModel = records.reduce((acc, r) => {
    const key = `${r.vendorId}${DELIM}${r.modelName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, ProvenanceRecord[]>);

  const completeness = (vendorId: string, modelName: string) => {
    const steps = (byVendorModel[`${vendorId}${DELIM}${modelName}`] ?? []).map((r) => r.stepType);
    const unique = new Set(steps);
    return Math.round((unique.size / STEP_ORDER.length) * 100);
  };

  const handleSubmit = async () => {
    if (!form.vendorId || !form.modelName) return;
    setSaving(true);
    try {
      const created = await addProvenanceRecord({
        vendorId: form.vendorId,
        modelName: form.modelName,
        stepType: form.stepType,
        description: form.description || undefined,
        responsibleParty: form.responsibleParty || undefined,
        attestation: form.attestation,
        occurredAt: form.occurredAt ? new Date(form.occurredAt) : undefined
      });
      setRecords((prev) => [
        ...prev,
        {
          ...created,
          vendor: vendors.find((v) => v.id === created.vendorId) ?? { vendorName: "" }
        } as ProvenanceRecord
      ]);
      setForm({
        vendorId: "",
        modelName: "",
        stepType: "TRAINING_DATA",
        description: "",
        responsibleParty: "",
        attestation: false,
        occurredAt: ""
      });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {highRiskAssetCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Missing provenance warnings</p>
            <p className="text-sm text-amber-700">
              {highRiskAssetCount} HIGH risk asset(s) may require provenance documentation.
            </p>
            <Link href="/layer3-application/assets" className="mt-1 text-sm text-amber-800 hover:underline">
              View HIGH risk assets →
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.vendorName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500"
        >
          <Plus className="h-4 w-4" />
          Add provenance record
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(byVendorModel).map(([key, recs]) => {
          const [vendorId, modelName] = key.split(DELIM);
          const vendorName = recs[0]?.vendor.vendorName ?? "Unknown";
          const score = completeness(recs[0]?.vendorId ?? "", recs[0]?.modelName ?? "");
          if (vendorFilter && recs[0]?.vendorId !== vendorFilter) return null;
          const sorted = [...recs].sort(
            (a, b) => STEP_ORDER.indexOf(a.stepType) - STEP_ORDER.indexOf(b.stepType)
          );
          return (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">
                  {vendorName} — {modelName}
                </h3>
                <span
                  className={`rounded px-2 py-0.5 text-sm font-medium ${
                    score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {score}% complete
                </span>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {sorted.map((r, i) => (
                  <div
                    key={r.id}
                    className="min-w-[180px] rounded border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      {r.attestation ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs font-medium text-slate-600">
                        {STEP_LABELS[r.stepType] ?? r.stepType}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-900">{r.description ?? "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.occurredAt ? new Date(r.occurredAt).toLocaleDateString() : "—"} •{" "}
                      {r.responsibleParty ?? "—"}
                    </p>
                    <span className="mt-1 inline-block text-xs">
                      {r.attestation ? "Attested" : "Unattested"}
                    </span>
                  </div>
                ))}
                {sorted.length === 0 && (
                  <p className="text-sm text-slate-500">No provenance records yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(byVendorModel).length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          No provenance records. Add one to get started.
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-medium text-slate-900">Add provenance record</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Vendor</label>
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">— Select —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Model name</label>
                <input
                  value={form.modelName}
                  onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. GPT-4, Claude-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Step type</label>
                <select
                  value={form.stepType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      stepType: e.target.value as "TRAINING_DATA" | "BASE_MODEL" | "FINE_TUNING" | "DEPLOYMENT"
                    }))
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  {STEP_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STEP_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Responsible party</label>
                <input
                  value={form.responsibleParty}
                  onChange={(e) => setForm((f) => ({ ...f, responsibleParty: e.target.value }))}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Occurred at</label>
                <input
                  type="date"
                  value={form.occurredAt}
                  onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="attestation"
                  checked={form.attestation}
                  onChange={(e) => setForm((f) => ({ ...f, attestation: e.target.checked }))}
                />
                <label htmlFor="attestation" className="text-sm">
                  Attested
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !form.vendorId || !form.modelName}
                className="rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

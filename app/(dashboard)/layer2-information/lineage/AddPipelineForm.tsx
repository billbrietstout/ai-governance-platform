"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLineageRecord } from "./actions";

type Entity = { id: string; name: string };
type Asset = { id: string; name: string };

type Props = {
  entities: Entity[];
  assets: Asset[];
};

export function AddPipelineForm({ entities, assets }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sourceEntityId: "",
    targetAssetId: "",
    pipelineType: "ETL",
    transformations: "",
    refreshFrequency: "",
    dataClassification: "INTERNAL" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLineageRecord({
        name: form.name,
        description: form.description || undefined,
        sourceEntityId: form.sourceEntityId || undefined,
        targetAssetId: form.targetAssetId || undefined,
        pipelineType: form.pipelineType,
        transformations: form.transformations || undefined,
        refreshFrequency: form.refreshFrequency || undefined,
        dataClassification: form.dataClassification
      });
      router.push("/layer2-information/lineage");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Pipeline Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Pipeline Type *</label>
        <select
          value={form.pipelineType}
          onChange={(e) => setForm((f) => ({ ...f, pipelineType: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          {["ETL", "API", "STREAM", "BATCH", "MANUAL"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Source Entity</label>
        <select
          value={form.sourceEntityId}
          onChange={(e) => setForm((f) => ({ ...f, sourceEntityId: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">— None —</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Target AI Asset</label>
        <select
          value={form.targetAssetId}
          onChange={(e) => setForm((f) => ({ ...f, targetAssetId: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">— None —</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Transformation Description</label>
        <textarea
          value={form.transformations}
          onChange={(e) => setForm((f) => ({ ...f, transformations: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Refresh Frequency</label>
        <select
          value={form.refreshFrequency}
          onChange={(e) => setForm((f) => ({ ...f, refreshFrequency: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">— None —</option>
          {["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Data Classification</label>
        <select
          value={form.dataClassification}
          onChange={(e) => setForm((f) => ({ ...f, dataClassification: e.target.value as "INTERNAL" }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          {["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Pipeline"}
        </button>
        <Link
          href="/layer2-information/lineage"
          className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

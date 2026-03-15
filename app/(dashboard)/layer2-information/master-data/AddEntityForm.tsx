"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMasterDataEntity } from "./actions";

type User = { id: string; email: string };

type Props = {
  users: User[];
};

export function AddEntityForm({ users }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entityType: "CUSTOMER" as const,
    name: "",
    description: "",
    stewardId: "",
    classification: "INTERNAL" as const,
    qualityScore: "",
    recordCount: "",
    sourceSystem: "",
    aiAccessPolicy: "RESTRICTED" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMasterDataEntity({
        entityType: form.entityType,
        name: form.name,
        description: form.description || undefined,
        stewardId: form.stewardId || undefined,
        classification: form.classification,
        qualityScore: form.qualityScore ? parseFloat(form.qualityScore) : undefined,
        recordCount: form.recordCount ? parseInt(form.recordCount, 10) : undefined,
        sourceSystem: form.sourceSystem || undefined,
        aiAccessPolicy: form.aiAccessPolicy
      });
      router.push("/layer2-information/master-data");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Entity Type *</label>
        <select
          value={form.entityType}
          onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value as typeof form.entityType }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          required
        >
          {["CUSTOMER", "PRODUCT", "VENDOR", "EMPLOYEE", "FINANCE", "LOCATION", "OTHER"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Steward</label>
        <select
          value={form.stewardId}
          onChange={(e) => setForm((f) => ({ ...f, stewardId: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">— None —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Classification</label>
        <select
          value={form.classification}
          onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value as typeof form.classification }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          {["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">AI Access Policy</label>
        <select
          value={form.aiAccessPolicy}
          onChange={(e) => setForm((f) => ({ ...f, aiAccessPolicy: e.target.value as typeof form.aiAccessPolicy }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        >
          {["OPEN", "GOVERNED", "RESTRICTED", "PROHIBITED"].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Quality Score (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.qualityScore}
            onChange={(e) => setForm((f) => ({ ...f, qualityScore: e.target.value }))}
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Record Count</label>
          <input
            type="number"
            min={0}
            value={form.recordCount}
            onChange={(e) => setForm((f) => ({ ...f, recordCount: e.target.value }))}
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Source System</label>
        <input
          type="text"
          value={form.sourceSystem}
          onChange={(e) => setForm((f) => ({ ...f, sourceSystem: e.target.value }))}
          className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Entity"}
        </button>
        <Link
          href="/layer2-information/master-data"
          className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

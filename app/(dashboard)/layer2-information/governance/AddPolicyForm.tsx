"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DATA_CLASSIFICATION_LABELS, GOVERNANCE_POLICY_TYPE_LABELS } from "@/lib/ui/select-labels";
import { createGovernancePolicy } from "./actions";

const POLICY_TYPES = ["CLASSIFICATION", "RETENTION", "ACCESS", "QUALITY", "PRIVACY"] as const;
const CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const;

type User = { id: string; email: string };

export function AddPolicyForm({ users = [] }: { users?: User[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    policyType: "CLASSIFICATION" as (typeof POLICY_TYPES)[number],
    description: "",
    appliesTo: [] as ("PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED")[],
    controls: "",
    ownerId: ""
  });

  type Classification = (typeof CLASSIFICATIONS)[number];
  const toggleClassification = (c: Classification) => {
    setForm((f) => ({
      ...f,
      appliesTo: f.appliesTo.includes(c)
        ? f.appliesTo.filter((x) => x !== c)
        : ([...f.appliesTo, c] as Classification[])
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createGovernancePolicy({
        name: form.name,
        policyType: form.policyType,
        description: form.description,
        appliesTo: form.appliesTo,
        controls: form.controls
          ? form.controls
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        ownerId: form.ownerId || undefined
      });
      setForm({
        name: "",
        policyType: "CLASSIFICATION",
        description: "",
        appliesTo: [],
        controls: "",
        ownerId: ""
      });
      setExpanded(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left font-medium text-slate-900"
      >
        Add Policy
        <span className="text-slate-500">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-slate-200 pt-4">
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
            <label className="block text-sm font-medium text-slate-700">Policy Type *</label>
            <select
              value={form.policyType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  policyType: e.target.value as (typeof POLICY_TYPES)[number]
                }))
              }
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              {POLICY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              rows={2}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Applies to (classification levels)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CLASSIFICATIONS.map((c) => (
                <label key={c} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.appliesTo.includes(c)}
                    onChange={() => toggleClassification(c)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">{DATA_CLASSIFICATION_LABELS[c] ?? c}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Required controls (comma-separated)
            </label>
            <input
              type="text"
              value={form.controls}
              onChange={(e) => setForm((f) => ({ ...f, controls: e.target.value }))}
              placeholder="e.g. Encryption, Access Logging"
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Owner</label>
            <select
              value={form.ownerId}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
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
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Policy"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

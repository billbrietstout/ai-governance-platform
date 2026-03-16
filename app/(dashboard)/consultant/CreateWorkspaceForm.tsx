"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createConsultantWorkspaceAction } from "./actions";

const VERTICALS = [
  { value: "", label: "Select industry (optional)" },
  { value: "GENERAL", label: "General" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "FINANCIAL", label: "Financial Services" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "RETAIL", label: "Retail" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "PUBLIC_SECTOR", label: "Public Sector" },
  { value: "ENERGY", label: "Energy" }
];

const SCOPES = [
  { value: "FULL", label: "Full" },
  { value: "QUICK", label: "Quick" },
  { value: "CUSTOM", label: "Custom" }
];

export function CreateWorkspaceForm() {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await createConsultantWorkspaceAction(formData);
      await update({ orgId: result.clientOrgId });
      router.refresh();
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-slate-700">
          Client organization name <span className="text-red-500">*</span>
        </label>
        <input
          id="clientName"
          name="clientName"
          type="text"
          required
          maxLength={200}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label htmlFor="clientIndustryVertical" className="block text-sm font-medium text-slate-700">
          Client industry vertical
        </label>
        <select
          id="clientIndustryVertical"
          name="clientIndustryVertical"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {VERTICALS.map((v) => (
            <option key={v.value || "empty"} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-slate-700">
          Primary contact email (optional)
        </label>
        <input
          id="primaryContactEmail"
          name="primaryContactEmail"
          type="email"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="contact@client.com"
        />
      </div>

      <div>
        <label htmlFor="assessmentScope" className="block text-sm font-medium text-slate-700">
          Assessment scope
        </label>
        <select
          id="assessmentScope"
          name="assessmentScope"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {SCOPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}

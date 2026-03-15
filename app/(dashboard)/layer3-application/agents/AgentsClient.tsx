"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings2,
  Wrench,
  UserCheck,
  AlertTriangle,
  X,
  Check
} from "lucide-react";
import { updateAgentConfig } from "./actions";

type Asset = {
  id: string;
  name: string;
  assetType: string;
  autonomyLevel: string | null;
  overrideTier: string | null;
  humanOversightRequired: boolean;
  toolAuthorizations: string[];
  lifecycleStage: string;
  status?: string;
  oversightPolicy?: string | null;
  euRiskLevel: string | null;
  owner: { id: string; email: string } | null;
};

type Props = { initialAssets: Asset[] };

const AUTONOMY_TO_L: Record<string, string> = {
  HUMAN_ONLY: "L0",
  ASSISTED: "L1",
  SEMI_AUTONOMOUS: "L2",
  AUTONOMOUS: "L3"
};

const L_COLORS: Record<string, string> = {
  L0: "#6b7280",
  L1: "#3b82f6",
  L2: "#8b5cf6",
  L3: "#f97316",
  L4: "#ef4444",
  L5: "#dc2626"
};

const OVERRIDE_TOOLTIPS: Record<string, string> = {
  T1: "Soft guidance (automated)",
  T2: "Active redirect (<5 min AI Ops)",
  T3: "Pause & Review (<1 min Senior AI Ops)",
  T4: "Immediate halt (<10 sec Incident Commander)",
  T5: "Emergency shutdown (immediate CISO/Executive)"
};

const STAGE_COLORS: Record<string, string> = {
  DEVELOPMENT: "bg-slate-100 text-slate-700",
  TESTING: "bg-blue-100 text-blue-700",
  STAGING: "bg-amber-100 text-amber-700",
  PRODUCTION: "bg-emerald-100 text-emerald-700",
  DEPRECATED: "bg-red-100 text-red-700",
  RETIRED: "bg-gray-100 text-gray-500"
};

export function AgentsClient({ initialAssets }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [autonomyFilter, setAutonomyFilter] = useState<string>("");
  const [overrideFilter, setOverrideFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [configAsset, setConfigAsset] = useState<Asset | null>(null);
  const [toolsAsset, setToolsAsset] = useState<Asset | null>(null);
  const [overrideTier, setOverrideTier] = useState("");
  const [oversightPolicy, setOversightPolicy] = useState("");
  const [toolList, setToolList] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = assets.filter((a) => {
    if (autonomyFilter) {
      const l = AUTONOMY_TO_L[a.autonomyLevel ?? ""] ?? "L0";
      if (l !== autonomyFilter) return false;
    }
    if (overrideFilter) {
      if (overrideFilter === "__none__") {
        if (a.overrideTier) return false;
      } else if (a.overrideTier !== overrideFilter) {
        return false;
      }
    }
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const byAutonomy = assets.reduce((acc, a) => {
    const l = AUTONOMY_TO_L[a.autonomyLevel ?? ""] ?? "L0";
    acc[l] = (acc[l] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const humanOversightCount = assets.filter((a) => a.humanOversightRequired).length;
  const noOverrideCount = assets.filter(
    (a) => (a.autonomyLevel === "SEMI_AUTONOMOUS" || a.autonomyLevel === "AUTONOMOUS") && !a.overrideTier
  ).length;

  const openConfig = (a: Asset) => {
    setConfigAsset(a);
    setOverrideTier(a.overrideTier ?? "");
    setOversightPolicy(a.oversightPolicy ?? "");
  };

  const openTools = (a: Asset) => {
    setToolsAsset(a);
    setToolList((a.toolAuthorizations ?? []).join("\n"));
  };

  const saveConfig = async () => {
    if (!configAsset) return;
    setSaving(true);
    try {
      await updateAgentConfig({
        id: configAsset.id,
        overrideTier: (overrideTier || null) as "T1" | "T2" | "T3" | "T4" | "T5" | null,
        oversightPolicy: oversightPolicy || null
      });
      setAssets((prev) =>
        prev.map((a) =>
          a.id === configAsset.id
            ? { ...a, overrideTier: overrideTier || null, oversightPolicy: oversightPolicy || null }
            : a
        )
      );
      setConfigAsset(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveTools = async () => {
    if (!toolsAsset) return;
    setSaving(true);
    try {
      const list = toolList
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateAgentConfig({
        id: toolsAsset.id,
        toolAuthorizations: list
      });
      setAssets((prev) =>
        prev.map((a) => (a.id === toolsAsset.id ? { ...a, toolAuthorizations: list } : a))
      );
      setToolsAsset(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">By autonomy:</span>
          {["L0", "L1", "L2", "L3"].map((l) => (
            <span
              key={l}
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${L_COLORS[l]}20`, color: L_COLORS[l] }}
            >
              {l}: {byAutonomy[l] ?? 0}
            </span>
          ))}
        </div>
        <div className="border-l border-slate-200 pl-4">
          <span className="text-sm text-slate-600">Human oversight required: </span>
          <span className="font-medium">{humanOversightCount}</span>
        </div>
        {noOverrideCount > 0 && (
          <div className="flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{noOverrideCount} with no override tier (risk)</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="autonomy-filter" className="text-sm font-medium text-slate-700">
            Autonomy Level
          </label>
          <select
            id="autonomy-filter"
            value={autonomyFilter}
            onChange={(e) => setAutonomyFilter(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            <option value="">All Levels</option>
            <option value="L0">L0</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="L4">L4</option>
            <option value="L5">L5</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="override-filter" className="text-sm font-medium text-slate-700">
            Override Tier
          </label>
          <select
            id="override-filter"
            value={overrideFilter}
            onChange={(e) => setOverrideFilter(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            <option value="">All Tiers</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
            <option value="T4">T4</option>
            <option value="T5">T5</option>
            <option value="__none__">No override</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => {
          const l = AUTONOMY_TO_L[a.autonomyLevel ?? ""] ?? "L0";
          const color = L_COLORS[l];
          return (
            <div
              key={a.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <Link href={`/layer3-application/assets/${a.id}`} className="font-medium text-slate-900 hover:underline">
                  {a.name}
                </Link>
                <span
                  className="rounded px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: `${color}30`, color }}
                  title={a.autonomyLevel ?? "Unknown"}
                >
                  {l}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.overrideTier ? (
                  <span
                    className="cursor-help rounded bg-slate-100 px-2 py-0.5 text-xs"
                    title={OVERRIDE_TOOLTIPS[a.overrideTier]}
                  >
                    {a.overrideTier}
                  </span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">No override</span>
                )}
                <span className={`rounded px-2 py-0.5 text-xs ${STAGE_COLORS[a.lifecycleStage] ?? "bg-slate-100 text-slate-700"}`}>
                  {a.lifecycleStage}
                </span>
                {a.humanOversightRequired && (
                  <span className="flex items-center gap-0.5 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    <UserCheck className="h-3 w-3" />
                    Oversight
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {a.toolAuthorizations?.length ?? 0} tool(s) authorized
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openConfig(a)}
                  className="flex items-center gap-1.5 rounded bg-navy-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-500"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configure Override
                </button>
                <button
                  type="button"
                  onClick={() => openTools(a)}
                  className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Tool Auth
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          No agents match the current filters.
        </div>
      )}

      {/* Configure Override panel */}
      {configAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Configure Override — {configAsset.name}</h3>
              <button type="button" onClick={() => setConfigAsset(null)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Override tier</label>
                <select
                  value={overrideTier}
                  onChange={(e) => setOverrideTier(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">— Not set —</option>
                  {(["T1", "T2", "T3", "T4", "T5"] as const).map((t) => (
                    <option key={t} value={t} title={OVERRIDE_TOOLTIPS[t]}>
                      {t} — {OVERRIDE_TOOLTIPS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Oversight policy</label>
                <textarea
                  value={oversightPolicy}
                  onChange={(e) => setOversightPolicy(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Description of oversight mechanism..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfigAsset(null)} className="rounded border px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Tool Authorizations panel */}
      {toolsAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Manage Tool Authorizations — {toolsAsset.name}</h3>
              <button type="button" onClick={() => setToolsAsset(null)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">One tool/API per line</p>
            <textarea
              value={toolList}
              onChange={(e) => setToolList(e.target.value)}
              rows={8}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder="api.openai.com&#10;slack-api&#10;..."
            />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setToolsAsset(null)} className="rounded border px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTools}
                disabled={saving}
                className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

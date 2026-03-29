"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import {
  getUnownedHighRiskAssets,
  getUnownedAssets,
  getOrgUsers,
  getCaioUser,
  getAssignmentSuggestions,
  assignAccountabilityBulk
} from "./actions";
import { getUserDisplayName } from "@/lib/personas/display-names";
import type { DecisionType } from "./AIRiskBriefingClient";

type Asset = {
  id: string;
  name: string;
  description: string | null;
  euRiskLevel: string | null;
  cosaiLayer?: string | null;
  assetType?: string;
};
type UserType = { id: string; email: string; role?: string; persona?: string | null };
type Suggestion = UserType & { score: number; reason: string };

type Props = {
  decisionType: DecisionType;
  count?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function DecisionModal({ decisionType, count = 0, onClose, onSuccess }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [caio, setCaio] = useState<UserType | null>(null);
  const [suggestionsByAsset, setSuggestionsByAsset] = useState<Record<string, Suggestion[]>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assignmentMeta, setAssignmentMeta] = useState<
    Record<
      string,
      { suggestionRank?: number; suggestionReason?: string; wasAutoSuggested?: boolean }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smartAssignPreview, setSmartAssignPreview] = useState(false);
  const [smartAssignMap, setSmartAssignMap] = useState<
    Record<string, { userId: string; reason: string }>
  >({});

  const isHighRisk = decisionType === "ASSIGN_ACCOUNTABILITY_HIGH_RISK";
  const isAssign = decisionType === "ASSIGN_ACCOUNTABILITY" || isHighRisk;

  useEffect(() => {
    if (!isAssign) {
      setLoading(false);
      return;
    }
    (async () => {
      const [assetList, userList, caioUser] = await Promise.all([
        isHighRisk ? getUnownedHighRiskAssets() : getUnownedAssets(),
        getOrgUsers(),
        getCaioUser()
      ]);
      const assetArr = (assetList ?? []) as Asset[];
      const userArr = (userList ?? []) as UserType[];
      setAssets(assetArr);
      setUsers(userArr);
      setCaio((caioUser ?? null) as UserType | null);

      const suggMap: Record<string, Suggestion[]> = {};
      const initAssign: Record<string, string> = {};
      const initMeta: Record<
        string,
        { suggestionRank?: number; suggestionReason?: string; wasAutoSuggested?: boolean }
      > = {};

      for (const asset of assetArr.slice(0, 5)) {
        const res = await getAssignmentSuggestions(asset.id);
        const sugg = (res?.suggestions ?? []) as Suggestion[];
        suggMap[asset.id] = sugg;
        if (sugg.length > 0) {
          initAssign[asset.id] = sugg[0].id;
          initMeta[asset.id] = {
            suggestionRank: 1,
            suggestionReason: sugg[0].reason,
            wasAutoSuggested: true
          };
        } else {
          const fallback =
            userArr.find((u) => u.role === "CAIO" || u.role === "ADMIN") ?? userArr[0];
          if (fallback) initAssign[asset.id] = fallback.id;
        }
      }

      setSuggestionsByAsset(suggMap);
      setAssignments(initAssign);
      setAssignmentMeta(initMeta);
      setLoading(false);
    })();
  }, [isAssign, isHighRisk]);

  const handleAssignAll = (userId: string) => {
    const next: Record<string, string> = {};
    const nextMeta: Record<
      string,
      { suggestionRank?: number; suggestionReason?: string; wasAutoSuggested?: boolean }
    > = {};
    assets.forEach((a) => {
      next[a.id] = userId;
      nextMeta[a.id] = {};
    });
    setAssignments(next);
    setAssignmentMeta(nextMeta);
  };

  const handleSmartAssignPreview = () => {
    const map: Record<string, { userId: string; reason: string }> = {};
    assets.forEach((asset) => {
      const sugg = suggestionsByAsset[asset.id] ?? [];
      if (sugg.length > 0) {
        map[asset.id] = { userId: sugg[0].id, reason: sugg[0].reason };
      } else {
        const fallback = users.find((u) => u.role === "CAIO" || u.role === "ADMIN") ?? users[0];
        if (fallback) map[asset.id] = { userId: fallback.id, reason: "Default" };
      }
    });
    setSmartAssignMap(map);
    setSmartAssignPreview(true);
  };

  const handleConfirmSmartAssign = () => {
    const next: Record<string, string> = {};
    const nextMeta: Record<
      string,
      { suggestionRank?: number; suggestionReason?: string; wasAutoSuggested?: boolean }
    > = {};
    Object.entries(smartAssignMap).forEach(([assetId, { userId }], _, arr) => {
      next[assetId] = userId;
      const sugg = suggestionsByAsset[assetId] ?? [];
      const rank = sugg.findIndex((s) => s.id === userId) + 1;
      nextMeta[assetId] = {
        suggestionRank: rank > 0 ? rank : undefined,
        suggestionReason: sugg.find((s) => s.id === userId)?.reason,
        wasAutoSuggested: true
      };
    });
    setAssignments(next);
    setAssignmentMeta(nextMeta);
    setSmartAssignPreview(false);
  };

  const handleSave = async () => {
    if (!isAssign || assets.length === 0) return;
    setSaving(true);
    try {
      const input = Object.entries(assignments)
        .filter(([, userId]) => userId)
        .map(([assetId, userId]) => {
          const meta = assignmentMeta[assetId] ?? {};
          return {
            assetId,
            userId,
            ...(meta.suggestionRank != null && { suggestionRank: meta.suggestionRank }),
            ...(meta.suggestionReason && { suggestionReason: meta.suggestionReason }),
            ...(meta.wasAutoSuggested && { wasAutoSuggested: meta.wasAutoSuggested })
          };
        });
      if (input.length === 0) {
        setSaving(false);
        return;
      }
      const res = await assignAccountabilityBulk(input);
      const byUser =
        (
          res as {
            byUser?: Array<{
              userId: string;
              count: number;
              email?: string;
              persona?: string;
              role?: string;
            }>;
          }
        ).byUser ?? [];
      const parts = byUser.map(
        (u) =>
          `${getUserDisplayName({ email: u.email ?? "", persona: u.persona, role: u.role })} is now responsible for ${u.count} AI system${u.count === 1 ? "" : "s"}`
      );
      onSuccess(parts.join(". "));
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const handleSelectSuggestion = (
    assetId: string,
    userId: string,
    rank: number,
    reason: string,
    wasAuto: boolean
  ) => {
    setAssignments((prev) => ({ ...prev, [assetId]: userId }));
    setAssignmentMeta((prev) => ({
      ...prev,
      [assetId]: { suggestionRank: rank, suggestionReason: reason, wasAutoSuggested: wasAuto }
    }));
  };

  const handleSelectOther = (assetId: string, userId: string) => {
    setAssignments((prev) => ({ ...prev, [assetId]: userId }));
    setAssignmentMeta((prev) => ({
      ...prev,
      [assetId]: {}
    }));
  };

  if (
    decisionType === "ASSIGN_ACCOUNTABILITY_HIGH_RISK" ||
    decisionType === "ASSIGN_ACCOUNTABILITY"
  ) {
    const displayCount = count ?? assets.length;
    const mostSenior =
      users.find((u) => u.role === "CAIO") ?? users.find((u) => u.role === "ADMIN") ?? users[0];

    if (smartAssignPreview) {
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSmartAssignPreview(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Assign all to recommended owners
              </h2>
              <p className="mt-1 text-sm text-slate-600">Review the suggested assignments below.</p>
              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {assets.slice(0, 5).map((asset) => {
                  const entry = smartAssignMap[asset.id];
                  const user = entry ? users.find((u) => u.id === entry.userId) : null;
                  return (
                    <p key={asset.id} className="text-sm text-slate-700">
                      {asset.name} → {user ? getUserDisplayName(user) : "—"} ({entry?.reason ?? "—"}
                      )
                    </p>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmSmartAssign}
                  className="bg-navy-600 hover:bg-navy-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
                >
                  Confirm all
                </button>
                <button
                  type="button"
                  onClick={() => setSmartAssignPreview(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Review individually
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {displayCount} AI system{displayCount === 1 ? "" : "s"} need
              {displayCount === 1 ? "s" : ""} an owner
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              High-risk AI systems must have a named person responsible for their oversight. This
              takes 2 minutes.
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSmartAssignPreview}
                  className="border-navy-300 bg-navy-50/50 text-navy-700 hover:bg-navy-100 mt-4 w-full rounded-lg border-2 border-dashed py-2.5 text-sm font-medium"
                >
                  Assign all to recommended owners →
                </button>

                <div className="mt-4 space-y-3">
                  {assets.slice(0, 5).map((asset) => {
                    const sugg = suggestionsByAsset[asset.id] ?? [];
                    const selectedId = assignments[asset.id];
                    return (
                      <div
                        key={asset.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">{asset.name}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {asset.description || "No description"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                              asset.euRiskLevel === "HIGH" || asset.euRiskLevel === "UNACCEPTABLE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {asset.euRiskLevel ?? "Unclassified"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-500">Suggested owners</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {sugg.slice(0, 3).map((u, i) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() =>
                                handleSelectSuggestion(asset.id, u.id, i + 1, u.reason, true)
                              }
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                selectedId === u.id
                                  ? "bg-navy-600 text-white"
                                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <User className="h-3 w-3" />
                              {getUserDisplayName(u)} — {u.reason}
                              {selectedId === u.id && " ✓"}
                            </button>
                          ))}
                          <select
                            value={selectedId}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) {
                                const inSugg = sugg.find((s) => s.id === v);
                                if (inSugg) {
                                  handleSelectSuggestion(
                                    asset.id,
                                    v,
                                    sugg.indexOf(inSugg) + 1,
                                    inSugg.reason,
                                    true
                                  );
                                } else {
                                  handleSelectOther(asset.id, v);
                                }
                              }
                            }}
                            className="ml-1 rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="">Pick someone else ▾</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {getUserDisplayName(u)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {mostSenior && (
                  <button
                    type="button"
                    onClick={() => handleAssignAll(mostSenior.id)}
                    className="border-navy-200 bg-navy-50 text-navy-700 hover:bg-navy-100 mt-3 w-full rounded-lg border py-2 text-sm font-medium"
                  >
                    Assign all to {getUserDisplayName(mostSenior)}
                  </button>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-navy-600 hover:bg-navy-500 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save assignments"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSuccess("Reminder set for next week.");
                      onClose();
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Remind me next week
                  </button>
                  {caio && (
                    <button
                      type="button"
                      onClick={() => handleAssignAll(caio.id)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Delegate to {getUserDisplayName(caio)} →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (decisionType === "MATURITY_ASSESSMENT") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Quick readiness check</h2>
            <p className="mt-1 text-sm text-slate-600">
              Answer 5 questions to get your baseline. Takes about 2 minutes.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600">
                1. Do you have an AI oversight policy? (Yes/No)
              </p>
              <p className="text-sm text-slate-600">2. Are AI systems documented? (Yes/No)</p>
              <p className="text-sm text-slate-600">
                3. Are accountability owners assigned? (Yes/No)
              </p>
              <p className="text-sm text-slate-600">4. Do you monitor AI risks? (Yes/No)</p>
              <p className="text-sm text-slate-600">
                5. Do you review AI controls regularly? (Yes/No)
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href="/maturity"
                className="bg-navy-600 hover:bg-navy-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Start quick check →
              </a>
              <a
                href="/maturity"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Full assessment →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (decisionType === "GOVERNANCE_GAPS") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">EU AI Act compliance roadmap</h2>
            <p className="mt-1 text-sm text-slate-600">
              Three steps to meet the August 2026 deadline. Delegate each to your team.
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input type="checkbox" className="h-4 w-4" />
                <div>
                  <p className="font-medium text-slate-900">Step 1: Register high-risk systems</p>
                  <p className="text-xs text-slate-500">{count ?? 0} remaining</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input type="checkbox" className="h-4 w-4" />
                <div>
                  <p className="font-medium text-slate-900">Step 2: Assign accountability owners</p>
                  <p className="text-xs text-slate-500">In progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input type="checkbox" className="h-4 w-4" />
                <div>
                  <p className="font-medium text-slate-900">Step 3: Implement required controls</p>
                  <p className="text-xs text-slate-500">{count ?? 0} gaps to address</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess("Delegated to your team.");
                  onClose();
                }}
                className="bg-navy-600 hover:bg-navy-500 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                Delegate to AI Officer →
              </button>
              <a
                href="/layer3-application/gaps"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View details →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

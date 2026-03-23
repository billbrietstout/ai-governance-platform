"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  HeartPulse,
  Landmark,
  Shield,
  Building,
  Zap,
  Users,
  Car,
  Radio,
  Cog,
  ShoppingCart
} from "lucide-react";
import { VERTICAL_OPTIONS } from "@/lib/onboarding/steps";
import { VERTICAL_REGULATIONS } from "@/lib/vertical-regulations";
import type { VerticalKey } from "@/lib/vertical-regulations";
import { saveStep2 } from "./actions";

const VERTICAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GENERAL: Building2,
  FINANCIAL_SERVICES: Landmark,
  HEALTHCARE: HeartPulse,
  INSURANCE: Shield,
  PUBLIC_SECTOR: Building,
  ENERGY: Zap,
  HR_SERVICES: Users,
  AUTOMOTIVE: Car,
  TELECOM: Radio,
  MANUFACTURING: Cog,
  RETAIL: ShoppingCart
};

type Props = {
  completedData: { clientVerticals: string[] };
  onNext: () => void;
  isPending: boolean;
};

export function Step2Verticals({ completedData, onNext, isPending }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(completedData.clientVerticals));

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const regulations = useMemo(() => {
    const codes = new Map<string, { name: string; jurisdiction: string; mandatory: boolean }>();
    for (const vk of selected) {
      const profile = VERTICAL_REGULATIONS[vk as VerticalKey];
      if (!profile) continue;
      for (const r of profile.regulations) {
        if (!codes.has(r.code)) {
          codes.set(r.code, {
            name: r.name,
            jurisdiction: r.jurisdiction,
            mandatory: r.mandatory
          });
        }
      }
    }
    return Array.from(codes.entries()).map(([code, meta]) => ({ code, ...meta }));
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) return;
    await saveStep2({ clientVerticals: Array.from(selected) });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <p className="mb-4 text-sm text-slate-600">
            Select all verticals your organization serves. Multi-select.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VERTICAL_OPTIONS.map((opt) => {
              const Icon = VERTICAL_ICONS[opt.value] ?? Building2;
              const isSelected = selected.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition ${
                    isSelected
                      ? "border-navy-500 bg-navy-50 ring-navy-500 ring-1"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-8 w-8 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:w-80">
          <h3 className="text-sm font-medium text-slate-700">Applicable regulations</h3>
          <p className="mt-1 text-xs text-slate-500">
            Updates in real time as you select verticals
          </p>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {regulations.length === 0 ? (
              <li className="text-sm text-slate-500">
                Select at least one vertical to see regulations
              </li>
            ) : (
              regulations.map((r) => (
                <li
                  key={r.code}
                  className="rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{r.code}</span>
                  <span className="ml-1 text-slate-600">— {r.name}</span>
                  <span className="ml-1 text-xs text-slate-500">
                    ({r.jurisdiction}){r.mandatory && " • Mandatory"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={selected.size === 0 || isPending}
          className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Next"}
        </button>
      </div>
    </form>
  );
}

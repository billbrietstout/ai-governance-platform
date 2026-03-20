"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  DollarSign,
  LayoutGrid,
  Shield,
  Scale,
  Bot,
  Database,
  Code,
  Server,
  Package,
  Layers,
  Loader2,
  Check
} from "lucide-react";
import { PERSONA_CONFIGS, type PersonaId } from "@/lib/personas/config";
import { setUserPersona } from "../persona/actions";

const PERSONA_ICONS: Record<PersonaId, React.ComponentType<{ className?: string }>> = {
  CEO: Building2,
  CFO: DollarSign,
  COO: LayoutGrid,
  CISO: Shield,
  LEGAL: Scale,
  CAIO: Bot,
  DATA_OWNER: Database,
  DEV_LEAD: Code,
  PLATFORM_ENG: Server,
  VENDOR_MGR: Package
};

const PERSONA_ORDER: PersonaId[] = [
  "CAIO",
  "CEO",
  "CFO",
  "COO",
  "CISO",
  "LEGAL",
  "DATA_OWNER",
  "DEV_LEAD",
  "PLATFORM_ENG",
  "VENDOR_MGR"
];

type PendingId = PersonaId | "all-layers";

export function PersonaSelectGrid() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingId | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = pending !== null;

  const handleSelect = async (personaId: PersonaId | null) => {
    setError(null);
    setPending(personaId === null ? "all-layers" : personaId);
    setSaved(false);

    try {
      const result = await setUserPersona(personaId);
      setSaved(true);
      router.refresh();
      await new Promise((r) => setTimeout(r, 300));
      const landing =
        result?.data?.defaultLandingPage ??
        (personaId ? PERSONA_CONFIGS[personaId].defaultLandingPage : "/");
      router.push(landing);
    } catch {
      setError("Failed to save. Please try again.");
      setPending(null);
      setSaved(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONA_ORDER.map((id) => {
          const config = PERSONA_CONFIGS[id];
          const Icon = PERSONA_ICONS[id];
          const isSelected = pending === id;
          const state = isSelected ? (saved ? "saved" : "loading") : "idle";
          const isDisabled = isBusy && !isSelected;

          return (
            <button
              key={id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(id)}
              className={`flex flex-col gap-3 rounded-lg border p-4 text-left shadow-sm transition ${
                isDisabled
                  ? "pointer-events-none cursor-not-allowed opacity-50"
                  : state === "loading"
                    ? "animate-pulse border-2 border-blue-500 bg-blue-50/30 shadow-md"
                    : state === "saved"
                      ? "border-2 border-emerald-500 bg-emerald-50/30 shadow-md"
                      : "hover:border-navy-300 border-slate-200 bg-white hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    state === "loading"
                      ? "bg-blue-100"
                      : state === "saved"
                        ? "bg-emerald-100"
                        : "bg-navy-100"
                  }`}
                >
                  {state === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : state === "saved" ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Icon className="text-navy-600 h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{config.label}</h2>
                  <p className="text-sm text-slate-500">{config.description}</p>
                </div>
              </div>
              <span className="text-navy-600 text-sm font-medium">
                {state === "loading"
                  ? "Saving..."
                  : state === "saved"
                    ? "Saved ✓"
                    : "Select view →"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleSelect(null)}
          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
            pending === "all-layers"
              ? `border-2 border-blue-500 bg-blue-50/30 ${saved ? "" : "animate-pulse cursor-wait"}`
              : isBusy
                ? "pointer-events-none cursor-not-allowed opacity-50"
                : "hover:opacity-90"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              pending === "all-layers" ? "bg-blue-100" : "bg-slate-200"
            }`}
          >
            {pending === "all-layers" ? (
              saved ? (
                <Check className="h-5 w-5 text-emerald-600" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )
            ) : (
              <Layers className="h-5 w-5 text-slate-600" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">View as all layers</h2>
            <p className="text-sm text-slate-500">
              Full access across all CoSAI layers (CAIO / admin default)
            </p>
          </div>
          <span className="text-navy-600 text-sm font-medium">
            {pending === "all-layers" ? (saved ? "Saved ✓" : "Saving...") : "Select →"}
          </span>
        </button>
      </div>

      {isBusy && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

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
  Loader2,
  Check
} from "lucide-react";
import { PERSONA_CONFIGS, type PersonaId } from "@/lib/personas/config";
import { setUserPersona, dismissPersonaModal } from "@/app/(dashboard)/persona/actions";

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

type Props = {
  onDismiss?: () => void;
};

type PendingAction = PersonaId | "all-layers" | "skip";

export function PersonaModal({ onDismiss }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction | null>(null);
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
      onDismiss?.();
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

  const handleSkip = async () => {
    setError(null);
    setPending("skip");
    setSaved(false);

    try {
      await dismissPersonaModal();
      setSaved(true);
      onDismiss?.();
      router.refresh();
      await new Promise((r) => setTimeout(r, 300));
      router.push("/");
    } catch {
      setError("Failed to save. Please try again.");
      setPending(null);
      setSaved(false);
    }
  };

  const getCardState = (id: PersonaId) => {
    const key = id === null ? "all-layers" : id;
    if (pending !== key) return "idle";
    if (saved) return "saved";
    return "loading";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">What&apos;s your role?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a view tailored to your responsibilities. You can change this anytime.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PERSONA_ORDER.map((id) => {
            const config = PERSONA_CONFIGS[id];
            const Icon = PERSONA_ICONS[id];
            const state = getCardState(id);
            const isSelected = pending === id;
            const isDisabled = isBusy && !isSelected && !saved;

            return (
              <button
                key={id}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(id)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition ${
                  isDisabled
                    ? "pointer-events-none cursor-not-allowed opacity-50"
                    : state === "loading"
                      ? "border-2 border-blue-500 bg-blue-50/50 animate-pulse"
                      : state === "saved"
                        ? "border-2 border-emerald-500 bg-emerald-50/50"
                        : "border border-slate-200 hover:border-navy-300 hover:bg-navy-50/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {state === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : state === "saved" ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-navy-600" />
                  )}
                  <span className="font-medium text-slate-900">{config.label}</span>
                </div>
                <span className="text-xs text-slate-500 line-clamp-2">{config.description}</span>
              </button>
            );
          })}
        </div>

        {isBusy && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleSelect(null)}
            className={`text-sm hover:underline ${
              isBusy ? "cursor-not-allowed text-slate-400" : "text-slate-600 hover:text-slate-900"
            } ${pending === "all-layers" ? "font-medium text-blue-600" : ""}`}
          >
            {pending === "all-layers" ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                View as all layers
              </span>
            ) : (
              "View as all layers"
            )}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleSkip}
            className={`text-sm hover:text-slate-700 ${
              isBusy ? "cursor-not-allowed text-slate-400" : "text-slate-500"
            } ${pending === "skip" ? "font-medium" : ""}`}
          >
            {pending === "skip" ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                Skip for now
              </span>
            ) : (
              "Skip for now"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

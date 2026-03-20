"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { X, LayoutDashboard, Newspaper } from "lucide-react";
import { getPersonaDashboardPath } from "@/lib/personas/dashboard-routes";
import { getPersonaConfig } from "@/lib/personas/config";

const STORAGE_KEY = "persona-shortcut-banner-dismissed";

type Props = {
  persona: string;
};

const EXECUTIVE_PERSONAS = ["CEO", "CFO", "COO"];

export function PersonaShortcutBanner({ persona }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  if (dismissed) return null;

  const personaConfig = getPersonaConfig(persona);
  const label = personaConfig?.label ?? persona;
  const path = getPersonaDashboardPath(persona);
  const isExecutive = EXECUTIVE_PERSONAS.includes(persona);
  const linkLabel = isExecutive ? "My Briefing" : "My Dashboard";

  if (!path) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <p className="text-sm text-blue-900">
        You&apos;re viewing as <span className="font-medium">{label}</span>.{" "}
        <Link
          href={path}
          className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 hover:underline"
        >
          {isExecutive ? (
            <Newspaper className="h-4 w-4" />
          ) : (
            <LayoutDashboard className="h-4 w-4" />
          )}
          Switch to your focused view → {linkLabel}
        </Link>
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

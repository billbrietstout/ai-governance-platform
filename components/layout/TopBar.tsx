"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Settings, ChevronDown } from "lucide-react";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { getPersonaDashboardPath } from "@/lib/personas/dashboard-routes";
import { getPersonaConfig } from "@/lib/personas/config";

type TopBarProps = {
  userEmail?: string | null;
  orgName?: string | null;
  persona?: string | null;
};

export function TopBar({ userEmail, orgName, persona }: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const personaDashboardPath = getPersonaDashboardPath(persona ?? null);

  const initials = userEmail ? userEmail.split("@")[0].slice(0, 2).toUpperCase() : "?";
  const displayName = userEmail
    ? userEmail
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";
  const personaConfig = persona ? getPersonaConfig(persona) : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
      <Link
        href={personaDashboardPath ?? "/dashboard"}
        className="focus-visible:ring-navy-500 flex items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ShieldLogo className="text-navy-500 h-8 w-8 shrink-0" />
        <span className="text-lg font-semibold text-slate-900">AI Readiness</span>
      </Link>

      <div className="flex items-center gap-3">
        {persona ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setViewDropdownOpen((o) => !o)}
              className="hover:text-navy-600 focus-visible:ring-navy-500 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Viewing as: {personaConfig?.label ?? persona} <ChevronDown className="h-4 w-4" />
            </button>
            {viewDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setViewDropdownOpen(false)}
                  aria-hidden
                />
                <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                  <Link
                    href="/persona-select"
                    className="focus-visible:ring-navy-500 flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={() => setViewDropdownOpen(false)}
                  >
                    Switch view →
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/persona-select"
            className="hover:text-navy-600 focus-visible:ring-navy-500 rounded text-sm font-medium text-slate-600 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Choose view →
          </Link>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
          >
            <div className="bg-navy-100 text-navy-600 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">{orgName ?? "Organization"}</p>
            </div>
          </button>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{orgName ?? "Organization"}</p>
                  {personaConfig && (
                    <span className="bg-navy-100 text-navy-700 mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium">
                      {personaConfig.label}
                    </span>
                  )}
                </div>
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

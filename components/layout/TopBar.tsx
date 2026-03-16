"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { User, LayoutGrid, Settings } from "lucide-react";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { getPersonaDashboardPath } from "@/lib/personas/dashboard-routes";
import { getPersonaConfig } from "@/lib/personas/config";

type TopBarProps = {
  userEmail?: string | null;
  orgName?: string | null;
  persona?: string | null;
};

export function TopBar({ userEmail, orgName, persona }: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "?";
  const displayName = userEmail
    ? userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";
  const personaDashboardPath = getPersonaDashboardPath(persona ?? null);
  const personaConfig = persona ? getPersonaConfig(persona) : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
      <Link href={personaDashboardPath ?? "/dashboard"} className="flex items-center gap-2">
        <ShieldLogo className="h-8 w-8 shrink-0 text-navy-500" />
        <span className="text-lg font-semibold text-slate-900">AI Posture</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard?view=full"
          className="text-sm text-slate-500 hover:text-navy-600 hover:underline"
        >
          Full platform →
        </Link>

        {persona && (
          <Tooltip content="Switch to your focused view" side="bottom">
            <Link
              href={personaDashboardPath ?? "/persona-select"}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy-600"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">My view</span>
            </Link>
          </Tooltip>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-sm font-medium text-navy-600">
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
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{orgName ?? "Organization"}</p>
                  {personaConfig && (
                    <span className="mt-1 inline-block rounded bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700">
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

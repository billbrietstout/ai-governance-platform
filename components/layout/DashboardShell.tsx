"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  getPersonaSidebarConfig,
  type SidebarMode
} from "@/lib/personas/sidebar-config";
import { isPersonaDashboardPath } from "@/lib/personas/dashboard-routes";
import { SessionExpiryWarning } from "@/components/auth/SessionExpiryWarning";
import { getPersonaDashboardPath } from "@/lib/personas/dashboard-routes";

const STORAGE_KEY = "sidebar-mode";

type ConsultantWorkspace = { id: string; clientOrgId: string; clientName: string };

type DashboardShellProps = {
  persona?: string | null;
  userEmail?: string | null;
  orgName?: string | null;
  featureFlags?: Record<string, boolean>;
  frameworks?: { code: string }[];
  tier?: string;
  assetCount?: number;
  role?: string | null;
  consultantOrgId?: string | null;
  consultantWorkspaces?: ConsultantWorkspace[];
  consultantOrgName?: string | null;
  activeWorkspaceOrgId?: string | null;
  activeWorkspaceName?: string | null;
  isSuperAdmin?: boolean;
  children: React.ReactNode;
};

function getEffectiveMode(
  persona: string | null,
  pathname: string,
  storedMode: string | null
): SidebarMode {
  const isPersonaDashboard = isPersonaDashboardPath(pathname);
  if (!isPersonaDashboard) return "full";

  const config = persona ? getPersonaSidebarConfig(persona) : null;
  const personaMode = config?.mode ?? "full";

  if (storedMode === "full") return "full";
  return personaMode;
}

export function DashboardShell({
  persona,
  userEmail,
  orgName,
  featureFlags = {},
  frameworks = [],
  tier = "FREE",
  assetCount = 0,
  role,
  consultantOrgId = null,
  consultantWorkspaces = [],
  consultantOrgName = null,
  activeWorkspaceOrgId = null,
  activeWorkspaceName = null,
  isSuperAdmin = false,
  children
}: DashboardShellProps) {
  const pathname = usePathname();
  const [storedMode, setStoredMode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setStoredMode(localStorage.getItem(STORAGE_KEY));
    } catch {
      setStoredMode(null);
    }
  }, []);

  const effectiveMode = mounted
    ? getEffectiveMode(persona ?? null, pathname, storedMode)
    : "full";

  const expandToFull = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "full");
      setStoredMode("full");
    } catch {
      /* ignore */
    }
  }, []);

  const resetToPersonaView = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStoredMode(null);
    } catch {
      /* ignore */
    }
  }, []);

  const personaDashboardPath = getPersonaDashboardPath(persona ?? null);

  if (effectiveMode === "hidden") {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar
          userEmail={userEmail}
          orgName={orgName}
          persona={persona}
        />
        <main className="dashboard-content flex-1 overflow-auto bg-slate-100">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
            <div className="mb-4">
              <Breadcrumbs />
            </div>
            <div className="page-fade-in">{children}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <SessionExpiryWarning />
      <Sidebar
        userEmail={userEmail}
        orgName={orgName}
        persona={persona}
        featureFlags={featureFlags}
        frameworks={frameworks}
        tier={tier}
        assetCount={assetCount}
        role={role}
        consultantOrgId={consultantOrgId}
        consultantWorkspaces={consultantWorkspaces}
        consultantOrgName={consultantOrgName}
        activeWorkspaceOrgId={activeWorkspaceOrgId}
        activeWorkspaceName={activeWorkspaceName}
        sidebarMode={effectiveMode}
        onExpandToFull={expandToFull}
        onResetToPersonaView={persona ? resetToPersonaView : undefined}
        isSuperAdmin={isSuperAdmin}
      />
      <main className="dashboard-content flex-1 overflow-auto bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Breadcrumbs />
            {persona && (
              <Tooltip content="Switch to your focused view" side="bottom">
                <Link
                  href={personaDashboardPath ?? "/persona-select"}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-navy-600"
                >
                  <LayoutGrid className="h-4 w-4" />
                  My view
                </Link>
              </Tooltip>
            )}
          </div>
          <div className="page-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

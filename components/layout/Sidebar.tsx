"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

type NavItem = { href: string; label: string };
type GatedSection = {
  title: string;
  flag: string;
  items: NavItem[];
};

/** CoSAI five-layer order: governance → business → information → application → platform → supply chain → settings */
const GATED_SECTIONS: GatedSection[] = [
  {
    title: "LAYER 2: INFORMATION",
    flag: "MODULE_SHADOW_AI",
    items: [
      { href: "/layer2-information/prompts", label: "Prompt Governance" },
      { href: "/layer2-information/data-catalog", label: "Data Catalog" },
      { href: "/layer2-information/shadow-ai", label: "Shadow AI Detection" }
    ]
  },
  {
    title: "LAYER 3: APPLICATION",
    flag: "",
    items: [
      { href: "/layer3-application/assets", label: "AI Assets" },
      { href: "/layer3-application/accountability", label: "Accountability Matrix" },
      { href: "/layer3-application/gaps", label: "Gap Analysis" },
      { href: "/assessments", label: "Assessments" }
    ]
  },
  {
    title: "LAYER 4: PLATFORM",
    flag: "MODULE_OPS_INTEL",
    items: [
      { href: "/layer4-platform/telemetry", label: "Telemetry & Monitoring" },
      { href: "/layer4-platform/drift", label: "Drift Detection" },
      { href: "/layer4-platform/alerts", label: "Alert Engine" }
    ]
  },
  {
    title: "LAYER 5: SUPPLY CHAIN",
    flag: "",
    items: [
      { href: "/layer5-supply-chain", label: "Model Registry" },
      { href: "/layer5-supply-chain/cards", label: "Artifact Cards" },
      { href: "/layer5-supply-chain/vendors", label: "Vendors" },
      { href: "/layer5-supply-chain/scanning", label: "Scan Coverage" }
    ]
  }
];

const ALL_SECTIONS: Array<{ title: string; items: NavItem[]; flag?: string }> = [
  {
    title: "GOVERNANCE OVERVIEW",
    items: [
      { href: "/", label: "Command Center" },
      { href: "/reports", label: "Reports" },
      { href: "/audit", label: "Audit Log" }
    ]
  },
  {
    title: "LAYER 1: BUSINESS",
    items: [{ href: "/layer1-business/regulatory-cascade", label: "Regulatory Cascade" }]
  },
  ...GATED_SECTIONS,
  {
    title: "SETTINGS",
    items: [
      { href: "/settings/users", label: "Users & Invites" },
      { href: "/settings", label: "Organization" },
      { href: "/settings/data", label: "Data & Privacy" }
    ]
  }
];

function getSectionForPath(pathname: string): string | null {
  for (const section of ALL_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) {
        return section.title;
      }
    }
  }
  return null;
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function PanelLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export type SidebarProps = {
  userEmail?: string | null;
  orgName?: string | null;
  featureFlags?: Record<string, boolean>;
};

export function Sidebar({ userEmail, orgName, featureFlags = {} }: SidebarProps) {
  const pathname = usePathname();
  const currentSection = getSectionForPath(pathname);

  const [collapsed, setCollapsedState] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const s = currentSection ? new Set([currentSection]) : new Set([ALL_SECTIONS[0].title]);
    return s;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCollapsedState(stored === "true");
    } catch {
      setCollapsedState(false);
    }
  }, []);

  useEffect(() => {
    if (currentSection) {
      setExpandedSections((prev) => new Set([...prev, currentSection]));
    }
  }, [currentSection]);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const initials = userEmail
    ? userEmail
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slatePro-800 bg-slatePro-950 transition-[width] ${
        collapsed ? "w-16" : "w-64"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-slatePro-800 px-3">
        {!collapsed && (
          <Link href="/" className="text-lg font-semibold text-slatePro-100">
            AI Governance
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded p-2 text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable nav – CoSAI five-layer order */}
      <div className="flex-1 overflow-y-auto py-2">
        {ALL_SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.title);
          const flag = "flag" in section ? section.flag : undefined;
          const enabled = !flag || (featureFlags[flag] ?? false);

          return (
            <div key={section.title} className="mb-1">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slatePro-500 hover:bg-slatePro-800/50 hover:text-slatePro-400"
              >
                {collapsed ? (
                  <span className="mx-auto text-slatePro-500">•••</span>
                ) : (
                  <>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{section.title}</span>
                  </>
                )}
              </button>
              {(collapsed || isExpanded) &&
                section.items.map((item) => {
                  const active = enabled && isActive(item.href, pathname);
                  if (!enabled) {
                    return (
                      <div
                        key={item.href}
                        className={`flex items-center gap-2 px-3 py-2 text-sm ${
                          collapsed ? "pl-4" : "pl-6"
                        } cursor-not-allowed text-slatePro-600`}
                        title="Available via module"
                      >
                        <LockIcon className="h-4 w-4 shrink-0" />
                        {collapsed ? (
                          <span className="truncate" style={{ maxWidth: "2rem" }}>
                            {item.label.slice(0, 2)}
                          </span>
                        ) : (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`block px-3 py-2 text-sm ${
                        collapsed ? "pl-4" : "pl-6"
                      } ${active ? "bg-navy-500/20 text-navy-300" : "text-slatePro-400 hover:bg-slatePro-800/50 hover:text-slatePro-200"}`}
                      aria-current={active ? "page" : undefined}
                    >
                      {collapsed ? (
                        <span className="truncate" style={{ maxWidth: "2rem" }}>
                          {item.label.slice(0, 2)}
                        </span>
                      ) : (
                        item.label
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* User / org / sign out */}
      <div className="border-t border-slatePro-800 p-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slatePro-700 text-sm font-medium text-slatePro-200"
            aria-hidden
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slatePro-200">{userEmail ?? "User"}</p>
              <p className="truncate text-xs text-slatePro-500">{orgName ?? "Organization"}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 w-full rounded px-3 py-1.5 text-left text-sm text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileBarChart,
  ScrollText,
  Building2,
  Sparkles,
  GitBranch,
  Layers,
  Database,
  FileText,
  Shield,
  MessageSquareWarning,
  BookOpen,
  Eye,
  Cpu,
  Bot,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Server,
  Package,
  Archive,
  CreditCard,
  Building,
  ScanLine,
  Settings,
  UserPlus,
  Briefcase,
  Lock,
  LockKeyhole,
  Search,
  TrendingUp,
  Camera,
  Bell
} from "lucide-react";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { getPersonaConfig } from "@/lib/personas/config";

const STORAGE_KEY = "sidebar-collapsed";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type GatedSection = {
  title: string;
  flag: string;
  items: NavItem[];
};

const GATED_SECTIONS: GatedSection[] = [
  {
    title: "LAYER 2: INFORMATION",
    flag: "MODULE_SHADOW_AI",
    items: [
      { href: "/layer2-information/master-data", label: "Master Data", icon: Database },
      { href: "/layer2-information/lineage", label: "Data Lineage", icon: GitBranch },
      { href: "/layer2-information/governance", label: "Data Governance", icon: FileText },
      { href: "/layer2-information/classification", label: "Data Classification", icon: Shield },
      { href: "/layer2-information/prompts", label: "Prompt Governance", icon: MessageSquareWarning },
      { href: "/layer2-information/data-catalog", label: "Data Catalog", icon: BookOpen },
      { href: "/layer2-information/shadow-ai", label: "Shadow AI Detection", icon: Eye }
    ]
  },
  {
    title: "LAYER 3: APPLICATION",
    flag: "",
    items: [
      { href: "/layer3-application/assets", label: "AI Assets", icon: Bot },
      { href: "/layer3-application/accountability", label: "Accountability Matrix", icon: Users },
      { href: "/layer3-application/gaps", label: "Gap Analysis", icon: AlertTriangle },
      { href: "/assessments", label: "Assessments", icon: ClipboardCheck }
    ]
  },
  {
    title: "LAYER 4: PLATFORM",
    flag: "MODULE_OPS_INTEL",
    items: [
      { href: "/layer4-platform/telemetry", label: "Telemetry & Monitoring", icon: Server },
      { href: "/layer4-platform/drift", label: "Drift Detection", icon: Server },
      { href: "/layer4-platform/alerts", label: "Alert Engine", icon: Server }
    ]
  },
  {
    title: "LAYER 5: SUPPLY CHAIN",
    flag: "",
    items: [
      { href: "/layer5-supply-chain", label: "Model Registry", icon: Archive },
      { href: "/layer5-supply-chain/cards", label: "Artifact Cards", icon: CreditCard },
      { href: "/layer5-supply-chain/vendors", label: "Vendors", icon: Building },
      { href: "/layer5-supply-chain/scanning", label: "Scan Coverage", icon: ScanLine }
    ]
  }
];

const ALL_SECTIONS: Array<{ title: string; items: NavItem[]; flag?: string }> = [
  {
    title: "GOVERNANCE OVERVIEW",
    items: [
      { href: "/", label: "Command Center", icon: LayoutDashboard },
      { href: "/maturity", label: "Maturity Assessment", icon: TrendingUp },
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/compliance/snapshots", label: "Snapshots", icon: Camera },
      { href: "/compliance/regulation-feed", label: "Regulation Watch", icon: Bell },
      { href: "/audit-package", label: "Audit Package", icon: Package },
      { href: "/audit-package/evidence-workbook", label: "Evidence Workbook", icon: BookOpen },
      { href: "/audit", label: "Audit Log", icon: ScrollText }
    ]
  },
  {
    title: "PLANNING TOOLS",
    items: [
      { href: "/discover", label: "Regulation Discovery", icon: Sparkles },
      { href: "/discover/operating-model", label: "Operating Model", icon: Layers },
      { href: "/discover/use-cases", label: "Use Case Library", icon: BookOpen }
    ]
  },
  {
    title: "LAYER 1: BUSINESS",
    items: [
      { href: "/layer1-business", label: "Executive Dashboard", icon: Building2 },
      { href: "/layer1-business/regulatory-cascade", label: "Regulatory Cascade", icon: GitBranch }
    ]
  },
  ...GATED_SECTIONS,
  {
    title: "SETTINGS",
    items: [
      { href: "/settings/users", label: "Users & Invites", icon: UserPlus },
      { href: "/settings", label: "Organization", icon: Briefcase },
      { href: "/settings/data", label: "Data & Privacy", icon: Lock }
    ]
  }
];

const FRAMEWORK_COLORS: Record<string, string> = {
  NIST_AI_RMF: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  EU_AI_ACT: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  COSAI_SRF: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NIST_CSF: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ISO_42001: "bg-slatePro-500/20 text-slatePro-300 border-slatePro-500/30"
};

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

export type SidebarProps = {
  userEmail?: string | null;
  orgName?: string | null;
  persona?: string | null;
  featureFlags?: Record<string, boolean>;
  frameworks?: { code: string }[];
};

export function Sidebar({ userEmail, orgName, persona, featureFlags = {}, frameworks = [] }: SidebarProps) {
  const pathname = usePathname();
  const currentSection = getSectionForPath(pathname);

  const [collapsed, setCollapsedState] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const s = currentSection ? new Set([currentSection]) : new Set([ALL_SECTIONS[0].title]);
    return s;
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCollapsedState(stored === "true");
    } catch {
      setCollapsedState(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

  const displayName = userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User";

  const personaConfig = persona ? getPersonaConfig(persona) : null;
  const showFullOpacity = !persona || persona === "CAIO";
  const primarySections = new Set(personaConfig?.visibleSections ?? []);

  const isSectionPrimary = (title: string) => showFullOpacity || primarySections.has(title);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slatePro-800 bg-slatePro-950 transition-[width] ${
        collapsed ? "w-16" : "w-64"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / search / collapse */}
      <div className="flex h-14 items-center justify-between gap-2 border-b border-slatePro-800 px-3">
        {!collapsed && (
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
            <ShieldLogo className="h-8 w-8 shrink-0 text-navy-400" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slatePro-100">AI Governance</span>
              <span className="block text-[10px] text-slatePro-500">v1.0</span>
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slatePro-600 bg-slatePro-900/50 text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
            title="Search (Cmd+K)"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded p-2 text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className={`h-5 w-5 ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Global search modal placeholder – opens on Cmd+K */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-slatePro-700 bg-slatePro-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slatePro-700 px-4 py-3">
              <Search className="h-4 w-4 text-slatePro-500" />
              <input
                type="search"
                placeholder="Search assets, vendors, controls…"
                className="flex-1 bg-transparent text-slatePro-100 placeholder:text-slatePro-500 focus:outline-none"
                autoFocus
              />
              <kbd className="rounded bg-slatePro-700 px-2 py-0.5 text-xs text-slatePro-400">Esc</kbd>
            </div>
            <p className="px-4 py-3 text-xs text-slatePro-500">Search across assets, vendors, and controls. Full implementation coming soon.</p>
          </div>
        </div>
      )}

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-2">
        {ALL_SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.title);
          const flag = "flag" in section ? section.flag : undefined;
          const enabled = !flag || (featureFlags[flag] ?? false);
          const isPrimary = isSectionPrimary(section.title);
          const sectionOpacity = isPrimary ? "opacity-100" : "opacity-60";

          return (
            <div key={section.title} className={`mb-1 ${sectionOpacity}`}>
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
                  const Icon = item.icon;
                  if (!enabled) {
                    const showLock = showFullOpacity;
                    return (
                      <div
                        key={item.href}
                        className={`flex items-center gap-2 px-3 py-2 text-sm ${
                          collapsed ? "justify-center pl-2" : "pl-6"
                        } cursor-not-allowed text-slatePro-600`}
                        title="Available via module"
                      >
                        {showLock && <LockKeyhole className="h-4 w-4 shrink-0 text-amber-500/70" />}
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {showLock && (
                              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                                Module
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2 px-3 py-2 text-sm ${
                        collapsed ? "justify-center pl-2" : "pl-6"
                      } ${active ? "bg-navy-500/20 text-navy-300" : "text-slatePro-400 hover:bg-slatePro-800/50 hover:text-slatePro-200"}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Persona indicator */}
      {!collapsed && persona && (
        <div className="border-t border-slatePro-800 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-navy-500/30 px-2 py-0.5 text-xs font-medium text-navy-300">
              {personaConfig?.label ?? persona}
            </span>
            <Link
              href="/persona-select"
              className="text-xs text-navy-400 hover:text-navy-300 hover:underline"
            >
              Switch view
            </Link>
          </div>
        </div>
      )}

      {/* Active frameworks */}
      {!collapsed && frameworks.length > 0 && (
        <div className="border-t border-slatePro-800 px-3 py-2">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slatePro-500">
            Active Frameworks
          </div>
          <div className="flex flex-wrap gap-1">
            {frameworks.map((f) => (
              <span
                key={f.code}
                className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                  FRAMEWORK_COLORS[f.code] ?? "bg-slatePro-700/50 text-slatePro-400 border-slatePro-600"
                }`}
              >
                {f.code.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User avatar + dropdown */}
      <div className="relative border-t border-slatePro-800 p-3">
        <button
          type="button"
          onClick={() => setUserMenuOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slatePro-800/50"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-500/30 text-sm font-medium text-navy-300"
            aria-hidden
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-slatePro-200">{displayName}</p>
              <p className="truncate text-xs text-slatePro-500">{orgName ?? "Organization"}</p>
            </div>
          )}
        </button>
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
            <div className="absolute bottom-full left-3 right-3 z-50 mb-1 rounded-lg border border-slatePro-700 bg-slatePro-900 shadow-xl">
              <div className="border-b border-slatePro-700 px-3 py-2">
                <p className="text-sm font-medium text-slatePro-200">{displayName}</p>
                <p className="text-xs text-slatePro-500">{orgName ?? "Organization"}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full px-3 py-2 text-left text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

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
  Bell,
  Maximize2,
  RotateCcw,
  Newspaper,
  UserCircle,
  User
} from "lucide-react";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { WorkspaceContextBanner } from "./WorkspaceContextBanner";
import { GlobalSearch } from "@/app/(dashboard)/components/GlobalSearch";
import { Tooltip } from "@/components/ui/Tooltip";
import { getPersonaConfig, type PersonaId } from "@/lib/personas/config";
import { getPersonaSidebarConfig } from "@/lib/personas/sidebar-config";
import { getPersonaDashboardPath } from "@/lib/personas/dashboard-routes";
import { canAccessFeature, getAssetLimit, TIER_LIMITS, type GatedFeature } from "@/lib/tiers/gates";

const STORAGE_KEY = "sidebar-collapsed";
const STORAGE_KEY_EXPANDED = "sidebar-expanded-sections";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  changeHref?: string;
};
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
      { href: "/layer3-application/agents", label: "Agentic Registry", icon: Bot },
      { href: "/layer3-application/topology", label: "Integration Topology", icon: GitBranch },
      { href: "/layer3-application/lifecycle", label: "Lifecycle", icon: GitBranch },
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
      { href: "/layer5-supply-chain/provenance", label: "Model Provenance", icon: Layers },
      { href: "/layer5-supply-chain/risk-score", label: "Risk Scoring", icon: Shield },
      { href: "/layer5-supply-chain/scanning", label: "Scan Coverage", icon: ScanLine }
    ]
  }
];

const CLIENT_WORKSPACES_ITEM: NavItem = {
  href: "/consultant",
  label: "Client Workspaces",
  icon: Building2
};

const GOVERNANCE_OVERVIEW_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Posture Overview", icon: LayoutDashboard },
  { href: "/maturity", label: "Maturity Assessment", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/compliance/snapshots", label: "Snapshots", icon: Camera },
  { href: "/compliance/regulation-feed", label: "Regulation Watch", icon: Bell },
  { href: "/audit-package", label: "Audit Package", icon: Package },
  { href: "/audit-package/evidence-workbook", label: "Evidence Workbook", icon: BookOpen },
  { href: "/audit", label: "Audit Log", icon: ScrollText }
];

const PERSONA_FIRST_ITEM: Record<PersonaId, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  CEO: { href: "/dashboard/executive", label: "AI Risk Briefing", icon: Newspaper },
  CFO: { href: "/dashboard/executive", label: "AI Risk Briefing", icon: Newspaper },
  COO: { href: "/dashboard/executive", label: "AI Risk Briefing", icon: Newspaper },
  CAIO: { href: "/dashboard/caio", label: "CAIO View", icon: LayoutDashboard },
  CISO: { href: "/dashboard/ciso", label: "Security Overview", icon: LayoutDashboard },
  LEGAL: { href: "/dashboard/compliance-officer", label: "Compliance Status", icon: LayoutDashboard },
  DATA_OWNER: { href: "/dashboard/data-steward", label: "Data Governance", icon: LayoutDashboard },
  DEV_LEAD: { href: "/dashboard/developer", label: "Developer Checklist", icon: LayoutDashboard },
  PLATFORM_ENG: { href: "/dashboard/platform", label: "Platform & Ops", icon: LayoutDashboard },
  VENDOR_MGR: { href: "/dashboard/supply-chain", label: "Supply Chain", icon: LayoutDashboard }
};

function getGovernanceOverviewItems(
  persona: string | null,
  consultantOrgId?: string | null
): NavItem[] {
  const base = [...GOVERNANCE_OVERVIEW_ITEMS];
  if (consultantOrgId) {
    base.unshift(CLIENT_WORKSPACES_ITEM);
  }
  if (persona && persona in PERSONA_FIRST_ITEM) {
    const item = PERSONA_FIRST_ITEM[persona as PersonaId];
    const config = getPersonaConfig(persona as PersonaId);
    const label = config?.label ?? persona;
    return [
      {
        ...item,
        subtitle: `${label} view · `,
        changeHref: "/persona-select"
      },
      ...base
    ];
  }
  return [{ href: "/persona-select", label: "Choose my view", icon: UserCircle }, ...base];
}

const ALL_SECTIONS: Array<{ title: string; items: NavItem[]; flag?: string }> = [
  {
    title: "GOVERNANCE OVERVIEW",
    items: GOVERNANCE_OVERVIEW_ITEMS
  },
  {
    title: "COMPLIANCE",
    items: [
      { href: "/compliance/iso42001", label: "ISO 42001", icon: FileText },
      { href: "/compliance/eu-ai-act", label: "EU AI Act Conformity", icon: Shield }
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
      { href: "/layer1-business", label: "L1 Business Overview", icon: Building2 },
      { href: "/layer1-business/regulatory-cascade", label: "Regulatory Cascade", icon: GitBranch }
    ]
  },
  ...GATED_SECTIONS,
  {
    title: "SETTINGS",
    items: [
      { href: "/settings/profile", label: "Profile", icon: User },
      { href: "/settings/billing", label: "Billing", icon: CreditCard },
      { href: "/settings/users", label: "Users & Invites", icon: UserPlus },
      { href: "/settings/organization", label: "Organization", icon: Briefcase },
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/settings/data", label: "Data & Privacy", icon: Lock }
    ]
  }
];

/** Sidebar items gated by tier (FREE cannot access) */
const TIER_GATED_HREFS: Record<string, GatedFeature> = {
  "/compliance/snapshots": "compliance_snapshots",
  "/audit-package": "audit_packages",
  "/audit-package/evidence-workbook": "evidence_workbook",
  "/compliance/iso42001": "compliance_snapshots",
  "/compliance/eu-ai-act": "compliance_snapshots",
  "/reports": "compliance_snapshots"
};

const FRAMEWORK_COLORS: Record<string, string> = {
  NIST_AI_RMF: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  EU_AI_ACT: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  COSAI_SRF: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NIST_CSF: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ISO_42001: "bg-slatePro-500/20 text-slatePro-300 border-slatePro-500/30"
};

function getSectionForPath(
  pathname: string,
  persona: string | null,
  consultantOrgId?: string | null
): string | null {
  for (const section of ALL_SECTIONS) {
    const items =
      section.title === "GOVERNANCE OVERVIEW"
        ? getGovernanceOverviewItems(persona, consultantOrgId)
        : section.items;
    for (const item of items) {
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

type ConsultantWorkspace = { id: string; clientOrgId: string; clientName: string };

export type SidebarProps = {
  userEmail?: string | null;
  orgName?: string | null;
  persona?: string | null;
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
  sidebarMode?: "full" | "focused";
  onExpandToFull?: () => void;
  onResetToPersonaView?: () => void;
};

export function Sidebar({
  userEmail,
  orgName,
  persona,
  featureFlags = {},
  frameworks = [],
  tier = "FREE",
  assetCount = 0,
  role = null,
  consultantOrgId = null,
  consultantWorkspaces = [],
  consultantOrgName = null,
  activeWorkspaceOrgId = null,
  activeWorkspaceName = null,
  isSuperAdmin = false,
  sidebarMode = "full",
  onExpandToFull,
  onResetToPersonaView
}: SidebarProps) {
  const pathname = usePathname();
  const currentSection = getSectionForPath(pathname, persona ?? null, consultantOrgId);

  const [collapsed, setCollapsedState] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set([currentSection ?? ALL_SECTIONS[0].title])
  );
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
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXPANDED);
      if (stored) {
        const arr = JSON.parse(stored) as string[];
        if (Array.isArray(arr) && arr.length > 0) {
          setExpandedSections(new Set(arr));
        }
      }
    } catch {
      /* ignore */
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
      setExpandedSections((prev) => {
        const next = new Set([...prev, currentSection]);
        try {
          localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
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
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
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
  const sidebarConfig = persona ? getPersonaSidebarConfig(persona) : null;
  const showFullOpacity = !persona || persona === "CAIO";
  const primarySections = new Set(personaConfig?.visibleSections ?? []);

  const isSectionPrimary = (title: string) => showFullOpacity || primarySections.has(title);

  const isFocused = sidebarMode === "focused";
  const allowedSectionSet =
    sidebarConfig?.allowedSections === "all"
      ? new Set(ALL_SECTIONS.map((s) => s.title))
      : new Set((sidebarConfig?.allowedSections ?? []) as string[]);

  const focusedSections = ALL_SECTIONS.filter((s) => {
    if (!allowedSectionSet.has(s.title)) return false;
    const flag = "flag" in s ? (s as GatedSection).flag : undefined;
    return !flag || (featureFlags[flag] ?? false);
  });

  if (isFocused) {
    return (
      <aside
        className="flex w-12 shrink-0 flex-col border-r border-slatePro-800 bg-slatePro-950"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Banner */}
        <div className="border-b border-slatePro-800 px-2 py-2">
          <button
            type="button"
            onClick={onExpandToFull}
            className="w-full rounded px-1 py-1 text-[10px] leading-tight text-slatePro-400 hover:bg-slatePro-800 hover:text-navy-300"
          >
            {personaConfig?.label ?? persona} view · Show all →
          </button>
        </div>

        {/* Logo */}
        <div className="flex h-12 items-center justify-center border-b border-slatePro-800">
          <Link href={getPersonaDashboardPath(persona ?? null) ?? "/dashboard"}>
            <ShieldLogo className="h-6 w-6 text-navy-400" />
          </Link>
        </div>

        {/* Icon nav */}
        <div className="flex-1 overflow-y-auto py-2">
          {focusedSections.map((section) => {
            const mainHref = section.items[0]?.href ?? "/dashboard";
            const Icon = section.items[0]?.icon ?? LayoutDashboard;
            const active = isActive(mainHref, pathname);
            return (
              <Tooltip key={section.title} content={section.title} side="right">
                <Link
                  href={mainHref}
                  className={`flex h-10 w-full items-center justify-center ${
                    active ? "bg-navy-500/20 text-navy-300" : "text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </Tooltip>
            );
          })}
        </div>

        {/* Expand button */}
        <div className="border-t border-slatePro-800 p-2">
          <Tooltip content="Show full navigation" side="right">
            <button
              type="button"
              onClick={onExpandToFull}
              className="flex h-10 w-full items-center justify-center rounded text-slatePro-400 hover:bg-slatePro-800 hover:text-navy-300"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        {/* User avatar */}
        <div className="relative border-t border-slatePro-800 p-2">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex h-10 w-full items-center justify-center rounded-lg hover:bg-slatePro-800/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-500/30 text-sm font-medium text-navy-300">
              {initials}
            </div>
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
              <div className="absolute bottom-full left-12 z-50 mb-1 w-48 rounded-lg border border-slatePro-700 bg-slatePro-900 shadow-xl">
                <div className="border-b border-slatePro-700 px-3 py-2">
                  <p className="text-sm font-medium text-slatePro-200">{displayName}</p>
                  <p className="text-xs text-slatePro-500">{orgName ?? "Organization"}</p>
                </div>
                <Link
                  href={getPersonaDashboardPath(persona ?? null) ?? "/persona-select"}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  My Dashboard →
                </Link>
                {onResetToPersonaView && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetToPersonaView();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to my view
                  </button>
                )}
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                {role === "ADMIN" && (
                  <Link
                    href="/settings/admin"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {isSuperAdmin && (
                  <Link
                    href="/super-admin"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-slatePro-800 hover:text-amber-300"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Super Admin
                  </Link>
                )}
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

  return (
    <aside
      className={`relative flex shrink-0 flex-col overflow-hidden border-r border-slatePro-800 bg-slatePro-950 transition-[width] ${
        collapsed ? "w-16" : "w-64"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / search / collapse */}
      <div className="flex h-14 items-center justify-between gap-2 border-b border-slatePro-800 px-3">
        {!collapsed && (
          <Link
            href={getPersonaDashboardPath(persona ?? null) ?? "/dashboard"}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <ShieldLogo className="h-8 w-8 shrink-0 text-navy-400" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slatePro-100">AI Readiness</span>
              <span className="block text-[10px] text-slatePro-500">Readiness & Governance</span>
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

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {activeWorkspaceOrgId && activeWorkspaceName && !collapsed && (
        <WorkspaceContextBanner activeWorkspaceName={activeWorkspaceName} />
      )}

      {consultantOrgId && !activeWorkspaceOrgId && !collapsed && consultantOrgName && (
        <div className="relative overflow-visible border-b border-slatePro-800 px-3 py-2">
          <WorkspaceSwitcher
            consultantOrgId={consultantOrgId}
            consultantOrgName={consultantOrgName}
            consultantWorkspaces={consultantWorkspaces}
            activeWorkspaceOrgId={null}
          />
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
                (section.title === "GOVERNANCE OVERVIEW"
                  ? getGovernanceOverviewItems(persona ?? null, consultantOrgId)
                  : section.items
                ).map((item) => {
                  const gatedFeature = TIER_GATED_HREFS[item.href];
                  const tierEnabled = !gatedFeature || canAccessFeature(tier, gatedFeature);
                  const active = enabled && tierEnabled && isActive(item.href, pathname);
                  const Icon = item.icon;
                  const isTierLocked = !!gatedFeature && !tierEnabled;
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
                  const hasSubtitle = !collapsed && item.subtitle && item.changeHref;
                  return (
                    <div key={item.href} className={hasSubtitle ? "flex flex-col gap-0.5" : ""}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : isTierLocked ? "Upgrade to Pro" : undefined}
                        className={`flex items-center gap-2 px-3 py-2 text-sm ${
                          collapsed ? "justify-center pl-2" : "pl-6"
                        } ${active ? "bg-navy-500/20 text-navy-300" : "text-slatePro-400 hover:bg-slatePro-800/50 hover:text-slatePro-200"}`}
                        aria-current={active ? "page" : undefined}
                      >
                        {isTierLocked ? (
                          <Lock className="h-4 w-4 shrink-0 text-amber-500/70" />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0" />
                        )}
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {item.href === "/consultant" &&
                              consultantWorkspaces.length > 0 && (
                                <span className="shrink-0 rounded bg-navy-500/30 px-1.5 py-0.5 text-[10px] text-navy-300">
                                  {consultantWorkspaces.length}
                                </span>
                              )}
                            {isTierLocked && (
                              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                                Pro
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                      {hasSubtitle && (
                        <div className="px-3 pl-6 text-[10px] text-slatePro-500">
                          {item.subtitle}
                          <Link
                            href={item.changeHref!}
                            className="text-navy-400 hover:text-navy-300 hover:underline"
                          >
                            Change →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Tier indicator */}
      {!collapsed && tier === "FREE" && (
        <div className="border-t border-slatePro-800 p-3">
          <div className="rounded-lg bg-slatePro-800 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">Free Plan</span>
              <span className="text-xs text-amber-400">
                {assetCount}/{getAssetLimit(tier)} assets
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slatePro-700">
              <div
                className="h-1.5 rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(100, (assetCount / getAssetLimit(tier)) * 100)}%` }}
              />
            </div>
            <Link
              href="/pricing"
              className="mt-2 flex w-full items-center justify-center rounded-md bg-navy-600 py-1.5 text-xs font-medium text-white hover:bg-navy-500 transition-colors"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      )}
      {!collapsed && tier !== "FREE" && (
        <div className="border-t border-slatePro-800 p-3">
          <div className="flex flex-col gap-1.5">
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                tier === "PRO"
                  ? "bg-blue-500/20 text-blue-400"
                  : tier === "CONSULTANT"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-green-500/20 text-green-400"
              }`}
            >
              {tier === "PRO" ? "Pro Plan" : tier === "CONSULTANT" ? "Consultant Plan" : "Enterprise Plan"}
            </span>
            <span className="text-xs text-slatePro-400">
              {(TIER_LIMITS[tier?.toUpperCase() as keyof typeof TIER_LIMITS]?.assetLimit ?? 0) === 0
                ? "No asset limit"
                : `Up to ${TIER_LIMITS[tier?.toUpperCase() as keyof typeof TIER_LIMITS]?.assetLimit ?? 0} assets`}
            </span>
          </div>
        </div>
      )}

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
              <Link
                href={getPersonaDashboardPath(persona ?? null) ?? "/persona-select"}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                onClick={() => setUserMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                My Dashboard →
              </Link>
              {onResetToPersonaView && (
                <button
                  type="button"
                  onClick={() => {
                    onResetToPersonaView();
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to my view
                </button>
              )}
              <Link
                href="/settings/billing"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slatePro-300 hover:bg-slatePro-800 hover:text-slatePro-100"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-slatePro-800 hover:text-amber-300"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Super Admin
                </Link>
              )}
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
        {!collapsed && role === "ADMIN" && (
          <Link
            href="/settings/admin"
            className="mt-2 flex justify-center px-3 py-1 text-xs text-slatePro-600 hover:text-slatePro-400"
          >
            Admin
          </Link>
        )}
        {!collapsed && isSuperAdmin && (
          <Link
            href="/super-admin"
            className="mt-1 flex items-center justify-center gap-1 px-3 py-1 text-xs text-amber-500 hover:text-amber-400"
          >
            <Shield className="h-3 w-3" />
            Super Admin
          </Link>
        )}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Path segment to display label. Last segment may be dynamic (e.g. id). */
const SEGMENT_LABELS: Record<string, string> = {
  "": "Posture Overview",
  dashboard: "Posture Overview",
  audit: "Audit Log",
  "layer1-business": "Layer 1: Business",
  "regulatory-cascade": "Regulatory Cascade",
  "layer2-information": "Layer 2: Information",
  prompts: "Prompt Governance",
  "data-catalog": "Data Catalog",
  "shadow-ai": "Shadow AI Detection",
  "layer3-application": "Layer 3: Application",
  assets: "Assets",
  "new": "New Asset",
  gaps: "Gaps",
  accountability: "Accountability",
  "layer4-platform": "Layer 4: Platform",
  telemetry: "Telemetry & Monitoring",
  drift: "Drift Detection",
  alerts: "Alert Engine",
  "layer5-supply-chain": "Layer 5: Supply Chain",
  cards: "Cards",
  vendors: "Vendors",
  scanning: "Scanning",
  assessments: "Assessments",
  reports: "Reports",
  "executive-summary": "Executive Summary",
  "compliance-summary": "Compliance Summary",
  "gap-analysis": "Gap Analysis",
  "vendor-assurance": "Vendor Assurance",
  "scan-coverage": "Scan Coverage",
  "accountability-matrix": "Accountability Matrix",
  settings: "Settings",
  billing: "Billing",
  executive: "AI Risk Briefing",
  caio: "CAIO View",
  ciso: "Security Overview",
  "data-steward": "Data Governance",
  developer: "Developer Checklist",
  "compliance-officer": "Compliance Status",
  platform: "Platform & Ops",
  "supply-chain": "Supply Chain",
  data: "Data & Privacy",
  users: "Users & Invites",
  onboarding: "Onboarding",
  agents: "Agents",
  monitoring: "Monitoring",
  maintenance: "Maintenance",
  incidents: "Incidents",
  compliance: "Compliance",
  iso42001: "ISO 42001",
  "eu-ai-act": "EU AI Act Conformity",
  topology: "Integration Topology",
  provenance: "Model Provenance",
  "risk-score": "Risk Scoring"
};

function isLikelyId(segment: string): boolean {
  return segment.length >= 20 || /^[a-z0-9]{20,}$/i.test(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return (
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <span className="text-gray-900 font-medium">Posture Overview</span>
      </nav>
    );
  }

  const crumbs: { href: string; label: string }[] = [];
  let href = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    href += `/${seg}`;
    const label =
      SEGMENT_LABELS[seg] ??
      (isLikelyId(seg) ? "Details" : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
    crumbs.push({ href, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/dashboard" className="text-navy-600 hover:text-navy-700 hover:underline">
            Posture Overview
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <span aria-hidden className="text-gray-400">/</span>
            {i === crumbs.length - 1 ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-navy-600 hover:text-navy-700 hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

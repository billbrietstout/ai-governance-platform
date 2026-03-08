"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Path segment to display label. Last segment may be dynamic (e.g. id). */
const SEGMENT_LABELS: Record<string, string> = {
  "": "Command Center",
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
  data: "Data & Privacy",
  users: "Users & Invites",
  onboarding: "Onboarding",
  agents: "Agents",
  monitoring: "Monitoring",
  maintenance: "Maintenance",
  incidents: "Incidents"
};

function isLikelyId(segment: string): boolean {
  return segment.length >= 20 || /^[a-z0-9]{20,}$/i.test(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-sm text-slatePro-400">
        <span className="text-slatePro-200">Command Center</span>
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
    <nav aria-label="Breadcrumb" className="text-sm text-slatePro-400">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="text-navy-400 hover:underline">
            Command Center
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <span aria-hidden className="text-slatePro-600">
              /
            </span>
            {i === crumbs.length - 1 ? (
              <span className="text-slatePro-200">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-navy-400 hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

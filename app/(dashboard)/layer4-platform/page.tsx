/**
 * Layer 4 – Platform – index page with overview cards.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { Server, GitBranch, Bell } from "lucide-react";

export default async function Layer4PlatformPage() {
  const caller = await createServerCaller();
  const [telemetry, drift, alerts] = await Promise.all([
    caller.layer4.getTelemetry(),
    caller.layer4.getDrift(),
    caller.layer4.getAlerts()
  ]);

  const cards = [
    {
      href: "/layer4-platform/telemetry",
      icon: Server,
      title: "Telemetry & Monitoring",
      description: "Scan activity, coverage, and findings across all AI assets.",
      stats: [
        { label: "Total Scans", value: telemetry.data.summary.totalScans },
        { label: "Coverage", value: `${telemetry.data.summary.coveragePercent}%` },
        { label: "Critical Findings", value: telemetry.data.summary.criticalFindings, alert: telemetry.data.summary.criticalFindings > 0 }
      ]
    },
    {
      href: "/layer4-platform/drift",
      icon: GitBranch,
      title: "Drift Detection",
      description: "Monitor assets for stale scans, policy failures, and rising findings.",
      stats: [
        { label: "Flagged Assets", value: drift.data.summary.flaggedAssets, alert: drift.data.summary.flaggedAssets > 0 },
        { label: "HIGH Severity", value: drift.data.summary.bySeverity.HIGH, alert: drift.data.summary.bySeverity.HIGH > 0 },
        { label: "Clean Assets", value: drift.data.summary.cleanAssets }
      ]
    },
    {
      href: "/layer4-platform/alerts",
      icon: Bell,
      title: "Alert Engine",
      description: "Active alerts across policies, findings, governance, and security.",
      stats: [
        { label: "Critical", value: alerts.data.bySeverity.CRITICAL, alert: alerts.data.bySeverity.CRITICAL > 0 },
        { label: "High", value: alerts.data.bySeverity.HIGH, alert: alerts.data.bySeverity.HIGH > 0 },
        { label: "Total Alerts", value: alerts.data.total }
      ]
    }
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Layer 4: Platform</h1>
        <p className="mt-1 text-slate-600">
          Operational intelligence — telemetry, drift detection, and alert management for your AI platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-navy-600" />
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {card.stats.map(stat => (
                  <div key={stat.label}>
                    <p className={`text-lg font-bold ${stat.alert ? "text-red-600" : "text-slate-900"}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-navy-600">View Details →</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
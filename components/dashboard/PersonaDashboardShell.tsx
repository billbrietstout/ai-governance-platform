"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function PersonaDashboardShell({ title, subtitle, children }: Props) {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <Link
          href="/dashboard?view=full"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Switch to full platform →
        </Link>
      </div>
      {children}
    </main>
  );
}

"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon?: React.ReactNode;
};

export function EmptyState({ title, description, ctaLabel, ctaHref, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <div className="text-slate-400">{icon ?? <Bot className="mx-auto h-7 w-7" />}</div>
      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">{description}</p>
      <Link
        href={ctaHref}
        className="bg-navy-600 hover:bg-navy-500 mt-5 inline-flex items-center rounded px-3 py-1.5 text-sm font-medium text-white"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slatePro-600 bg-slatePro-900/30 py-16 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slatePro-800/50 text-slatePro-500">
        {icon ?? <Bot className="h-8 w-8" />}
      </div>
      <h3 className="mt-4 text-lg font-medium text-slatePro-200">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-slatePro-500">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

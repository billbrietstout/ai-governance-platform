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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Bot className="h-8 w-8" />}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-600">{description}</p>
      <Link
        href={ctaHref}
        className="bg-navy-600 hover:bg-navy-500 mt-6 rounded px-4 py-2 text-sm font-medium text-white"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyState({ title, description, ctaLabel, ctaHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slatePro-600 bg-slatePro-900/30 py-12 px-6">
      <h3 className="text-lg font-medium text-slatePro-200">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-slatePro-500">{description}</p>
      <Link
        href={ctaHref}
        className="mt-4 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

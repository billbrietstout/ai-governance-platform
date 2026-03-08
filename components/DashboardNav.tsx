"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Command Center" },
  { href: "/layer3-application/assets", label: "Assets" },
  { href: "/layer5-supply-chain/cards", label: "Cards" },
  { href: "/layer5-supply-chain/vendors", label: "Vendors" },
  { href: "/assessments", label: "Assessments" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" }
];

export function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="border-b border-slatePro-800 bg-slatePro-950"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded p-2 text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200 lg:hidden"
            aria-expanded={open}
            aria-controls="nav-menu"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link href="/" className="text-lg font-semibold text-slatePro-100">
            AI Governance
          </Link>
        </div>

        <div
          id="nav-menu"
          className={`absolute left-0 right-0 top-[57px] z-50 border-b border-slatePro-800 bg-slatePro-950 lg:static lg:flex lg:border-0 lg:bg-transparent ${
            open ? "block" : "hidden"
          }`}
        >
          <ul className="flex flex-col gap-0 py-2 lg:flex-row lg:gap-1 lg:py-0">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-2 text-sm lg:rounded lg:px-3 lg:py-2 ${
                      active
                        ? "bg-slatePro-800 text-navy-300 lg:bg-slatePro-800"
                        : "text-slatePro-400 hover:bg-slatePro-800 hover:text-slatePro-200"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

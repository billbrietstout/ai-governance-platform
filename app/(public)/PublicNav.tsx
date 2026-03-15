"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function PublicNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <nav className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Dashboard
        </Link>
        <Link
          href="/discover"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Discovery
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/discover/wizard"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Start free
      </Link>
      <Link
        href="/login"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Sign in
      </Link>
    </nav>
  );
}

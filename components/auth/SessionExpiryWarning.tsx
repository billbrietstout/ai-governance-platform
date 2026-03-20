"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

export function SessionExpiryWarning() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);
  const [extending, setExtending] = useState(false);

  const checkExpiry = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const session = await res.json();
      if (!session?.expires) return;
      const msLeft = new Date(session.expires).getTime() - Date.now();
      if (msLeft <= 0) {
        router.push("/login");
        return;
      }
      if (msLeft <= WARNING_BEFORE_EXPIRY_MS) {
        setMinutesLeft(Math.ceil(msLeft / 60000));
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkExpiry]);

  async function handleExtend() {
    setExtending(true);
    try {
      await fetch("/api/auth/session", { cache: "no-store" });
      setShowWarning(false);
      router.refresh();
    } finally {
      setExtending(false);
    }
  }

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 className="mb-1 text-center text-lg font-semibold text-gray-900">
          Your session is expiring
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          You&apos;ll be signed out in{" "}
          <span className="font-semibold text-amber-600">
            {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}
          </span>
          . Any unsaved changes may be lost.
        </p>
        <div className="space-y-2">
          <button
            onClick={handleExtend}
            disabled={extending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {extending ? "Extending session…" : "Stay signed in"}
          </button>
          <button
            onClick={() => router.push("/api/auth/signout")}
            className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Sign out now
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          AI Readiness Platform keeps you signed in for 8 hours of activity.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // warn 5 min before expiry
const CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds

export function SessionExpiryWarning() {
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);
  const [extending, setExtending] = useState(false);

  const checkExpiry = useCallback(() => {
    if (!session?.expires) return;

    const expiresAt = new Date(session.expires).getTime();
    const now = Date.now();
    const msLeft = expiresAt - now;

    if (msLeft <= 0) {
      // Already expired — redirect to login
      signIn();
      return;
    }

    if (msLeft <= WARNING_BEFORE_EXPIRY_MS) {
      setMinutesLeft(Math.ceil(msLeft / 60000));
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [session?.expires]);

  useEffect(() => {
    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkExpiry]);

  async function handleExtend() {
    setExtending(true);
    try {
      await update(); // refreshes the JWT
      setShowWarning(false);
    } finally {
      setExtending(false);
    }
  }

  function handleSignOut() {
    signIn(); // redirect to login
  }

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl border border-gray-100 p-6">

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 className="text-center text-lg font-semibold text-gray-900 mb-1">
          Your session is expiring
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          You'll be signed out in{" "}
          <span className="font-semibold text-amber-600">
            {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}
          </span>
          . Any unsaved changes may be lost.
        </p>

        <div className="space-y-2">
          <button
            onClick={handleExtend}
            disabled={extending}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {extending ? "Extending session…" : "Stay signed in"}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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

/**
 * app/unsubscribe/confirmed/page.tsx
 * One-click unsubscribe confirmation page — no auth required
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function UnsubscribeContent() {
  const params = useSearchParams();
  const email = params.get("email");
  const already = params.get("already") === "true";
  const token = params.get("token");
  const [resubscribed, setResubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResubscribe() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (res.ok) setResubscribed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        {/* Logo / Brand */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold tracking-widest text-gray-400 uppercase">
            AI Readiness Platform
          </p>
          <p className="text-xs text-gray-400">Built on CoSAI SRF v0.7</p>
        </div>

        {resubscribed ? (
          <>
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">You&apos;re back!</h1>
            <p className="mb-6 text-sm text-gray-500">
              Email notifications have been re-enabled for <strong>{email}</strong>.
            </p>
          </>
        ) : already ? (
          <>
            <div className="mb-4 text-4xl">📭</div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">Already unsubscribed</h1>
            <p className="mb-6 text-sm text-gray-500">
              This email address is already unsubscribed from AI Readiness Platform notifications.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 text-4xl">✉️</div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">
              You&apos;ve been unsubscribed
            </h1>
            <p className="mb-2 text-sm text-gray-500">
              <strong>{email}</strong> will no longer receive emails from AI Readiness Platform.
            </p>
            <p className="mb-6 text-xs text-gray-400">
              Changed your mind? You can re-enable notifications below or in your account settings.
            </p>
          </>
        )}

        <div className="space-y-3">
          {!resubscribed && token && (
            <button
              onClick={handleResubscribe}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Re-subscribing..." : "Re-enable email notifications"}
            </button>
          )}
          <Link
            href="/dashboard"
            className="block w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Go to dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          You can manage all notification preferences in{" "}
          <Link href="/settings/notifications" className="text-blue-500 hover:underline">
            account settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribeConfirmedPage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}

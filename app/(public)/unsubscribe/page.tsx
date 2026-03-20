/**
 * Unsubscribe confirmation page – CAN-SPAM and GDPR compliant.
 * Shown after user clicks unsubscribe link in email.
 */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const NOTIFICATION_TYPES = [
  "Weekly AI Risk Briefing digest",
  "Compliance score drop alerts",
  "Regulatory deadline reminders",
  "New high-risk AI system alerts",
  "Vendor evidence expiry notices",
  "Shadow AI detection alerts"
];

function UnsubscribeContent() {
  const params = useSearchParams();
  const unsubscribed = params.get("unsubscribed") === "true";
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const errorParam = params.get("error");

  const [status, setStatus] = useState<"idle" | "loading" | "resubscribed" | "error">("idle");

  async function handleResubscribe() {
    setStatus("loading");
    try {
      const res = await fetch("/api/v1/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        setStatus("resubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "resubscribed") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-semibold text-emerald-900">You&apos;re back!</h1>
          <p className="mt-2 text-emerald-800">
            Email notifications have been re-enabled for <strong>{email}</strong>. You&apos;ll start
            receiving updates again.
          </p>
          <Link
            href="/settings/notifications"
            className="mt-4 inline-block rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Manage preferences →
          </Link>
        </div>
      </main>
    );
  }

  if (errorParam === "invalid_token") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-red-900">Invalid unsubscribe link</h1>
          <p className="mt-2 text-red-800">
            This unsubscribe link is invalid or has expired. Please use the link from your most
            recent email.
          </p>
          <Link
            href="/settings/notifications"
            className="mt-4 inline-block rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage preferences →
          </Link>
        </div>
      </main>
    );
  }

  if (!unsubscribed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900">Unsubscribe</h1>
        <p className="mt-2 text-slate-600">
          Use the unsubscribe link in any AI Readiness Platform email to manage your preferences.
        </p>
        <Link
          href="/settings/notifications"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Manage notification preferences →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">
        You&apos;ve been unsubscribed from AI Readiness Platform emails
      </h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          <strong>Email:</strong> {email || "—"}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">What you&apos;ll stop receiving:</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
          {NOTIFICATION_TYPES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-red-600">
          Something went wrong. Please try again or manage preferences in settings.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        {token && (
          <>
            <button
              onClick={handleResubscribe}
              disabled={status === "loading"}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {status === "loading" ? "Re-subscribing..." : "Resubscribe"}
            </button>
            <button
              onClick={handleResubscribe}
              disabled={status === "loading"}
              className="text-sm text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
            >
              This was a mistake — re-enable immediately
            </button>
          </>
        )}
        <Link
          href="/settings/notifications"
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage preferences
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400">AI Readiness Platform · Built on CoSAI SRF v0.7</p>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}

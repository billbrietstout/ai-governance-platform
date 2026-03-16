/**
 * Unsubscribe confirmation page – CAN-SPAM and GDPR compliant.
 * Shown after user clicks unsubscribe link in email.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_TYPES = [
  "Weekly AI Risk Briefing digest",
  "Compliance score drop alerts",
  "Regulatory deadline reminders",
  "New high-risk AI system alerts",
  "Vendor evidence expiry notices",
  "Shadow AI detection alerts"
];

export default async function UnsubscribePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const unsubscribed = params.unsubscribed === "true";
  const resubscribed = params.resubscribed === "true";
  const email = params.email ?? "";

  let orgName: string | null = null;
  if (email) {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { orgId: true }
    });
    if (user) {
      const org = await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { name: true }
      });
      orgName = org?.name ?? null;
    }
  }

  if (resubscribed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-semibold text-emerald-900">You&apos;re back!</h1>
          <p className="mt-2 text-emerald-800">
            Email notifications have been re-enabled. You&apos;ll start receiving updates again.
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

  if (!unsubscribed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-900">Unsubscribe</h1>
        <p className="mt-2 text-slate-600">
          Use the unsubscribe link in any AI Posture Platform email to manage your preferences.
        </p>
        <Link
          href="/settings/notifications"
          className="mt-4 inline-block text-navy-600 hover:underline"
        >
          Manage notification preferences →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">
        You&apos;ve been unsubscribed from AI Posture Platform emails
      </h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          <strong>Organization:</strong> {orgName ?? "—"}
        </p>
        <p className="mt-1 text-sm text-slate-700">
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

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/api/v1/notifications/resubscribe?email=${encodeURIComponent(email)}`}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
        >
          Resubscribe
        </Link>
        <Link
          href="/settings/notifications"
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage preferences
        </Link>
        <Link
          href={`/api/v1/notifications/resubscribe?email=${encodeURIComponent(email)}`}
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          This was a mistake — re-enable immediately
        </Link>
      </div>
    </main>
  );
}

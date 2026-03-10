/**
 * Settings – enterprise AI governance platform.
 */
import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
      <nav className="flex flex-col gap-2">
        <Link
          href="/settings/users"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Users & Invites</span>
          <p className="mt-1 text-sm text-gray-600">Manage members and pending invites</p>
        </Link>
        <Link
          href="/settings/organization"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Organization</span>
          <p className="mt-1 text-sm text-gray-600">Client verticals and regulatory scope</p>
        </Link>
        <Link
          href="/settings/regulatory-profile"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Regulatory Profile</span>
          <p className="mt-1 text-sm text-gray-600">Industry vertical and applicable regulations</p>
        </Link>
        <Link
          href="/settings/data"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Data & Privacy</span>
          <p className="mt-1 text-sm text-gray-600">Retention policy, GDPR requests</p>
        </Link>
      </nav>
    </main>
  );
}

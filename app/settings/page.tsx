/**
 * Settings – enterprise AI governance platform.
 */
import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <nav className="flex flex-col gap-2">
        <Link
          href="/settings/users"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <span className="font-medium text-slatePro-200">Users & Invites</span>
          <p className="mt-1 text-sm text-slatePro-500">Manage members and pending invites</p>
        </Link>
        <Link
          href="/settings/data"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <span className="font-medium text-slatePro-200">Data & Privacy</span>
          <p className="mt-1 text-sm text-slatePro-500">Retention policy, GDPR requests</p>
        </Link>
      </nav>
    </main>
  );
}

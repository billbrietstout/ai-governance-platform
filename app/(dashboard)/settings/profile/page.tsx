/**
 * User profile – account info and communication preferences.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileCommunicationPrefs } from "./ProfileCommunicationPrefs";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string; email?: string | null } | undefined;
  if (!user?.id || !user?.orgId) {
    redirect("/login");
  }

  let pref = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
    select: { emailEnabled: true }
  });
  if (!pref) {
    pref = { emailEnabled: true };
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-navy-600 text-sm hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-600">Your account and communication preferences.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Account</h2>
        <div className="mt-4">
          <p className="text-sm text-gray-700">
            <strong>Email:</strong> {user.email ?? "—"}
          </p>
        </div>
      </section>

      <ProfileCommunicationPrefs emailEnabled={pref.emailEnabled} userEmail={user.email ?? null} />
    </main>
  );
}

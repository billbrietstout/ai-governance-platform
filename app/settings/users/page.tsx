/**
 * User & invite management – list users, invite form, pending invites.
 * Visible to ADMIN and CAIO only.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DomainClaimingForm } from "./DomainClaimingForm";
import { InviteForm } from "./InviteForm";
import { PendingInvitesList } from "./PendingInvitesList";

export default async function UsersSettingsPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string; role?: string } | undefined;
  if (!user?.orgId) {
    redirect("/login");
  }

  const role = user.role ?? "MEMBER";
  if (role !== "ADMIN" && role !== "CAIO") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
        <div>
          <Link href="/settings" className="text-sm text-navy-400 hover:underline">
            ← Settings
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Users & Invites</h1>
        </div>
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-6">
          <p className="text-slatePro-400">You need ADMIN or CAIO role to manage users and invites.</p>
        </div>
      </main>
    );
  }

  const [org, users, invites] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { claimedDomain: true, autoJoinRole: true }
    }),
    prisma.user.findMany({
      where: { orgId: user.orgId },
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" }
    }),
    prisma.pendingInvite.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-sm text-navy-400 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Users & Invites</h1>
        <p className="mt-1 text-slatePro-300">Manage organization members and pending invites.</p>
      </div>

      <section className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-6">
        <h2 className="text-lg font-medium text-slatePro-200">Current users</h2>
        <ul className="mt-3 space-y-2">
          {users.length === 0 ? (
            <li className="text-sm text-slatePro-500">No users yet.</li>
          ) : (
            users.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded border border-slatePro-800 bg-slatePro-950/50 px-3 py-2">
                <span className="text-slatePro-200">{u.email}</span>
                <span className="rounded bg-slatePro-700 px-2 py-0.5 text-xs font-medium text-slatePro-300">
                  {u.role}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {role === "ADMIN" && (
        <section className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-6">
          <h2 className="text-lg font-medium text-slatePro-200">Domain claiming</h2>
          <DomainClaimingForm
            claimedDomain={org?.claimedDomain ?? null}
            autoJoinRole={org?.autoJoinRole ?? "VIEWER"}
          />
        </section>
      )}

      {role === "ADMIN" && (
        <section className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-6">
          <h2 className="text-lg font-medium text-slatePro-200">Invite user</h2>
          <InviteForm />
        </section>
      )}

      {role === "ADMIN" && (
        <section className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-6">
          <h2 className="text-lg font-medium text-slatePro-200">Pending invites</h2>
          <PendingInvitesList invites={invites} />
        </section>
      )}
    </main>
  );
}

/**
 * Audit Log – organization audit trail.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function AuditLogPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  if (!user?.orgId) return null;

  const caller = await createServerCaller();
  const auditRes = await caller.dashboard.getAuditFeed({ limit: 100 });

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-navy-600 hover:underline">
          ← Command Center
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Audit Log</h1>
        <p className="mt-1 text-gray-600">Organization audit trail.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ul className="space-y-2">
          {auditRes.data.length === 0 ? (
            <li className="text-sm text-gray-500">No audit entries yet.</li>
          ) : (
            auditRes.data.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-4 rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span className="shrink-0 font-medium text-gray-600">{e.action}</span>
                <span className="text-gray-900">{e.resourceType}</span>
                <span className="text-gray-500">{e.resourceId.slice(0, 8)}…</span>
                <span className="ml-auto text-gray-500">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}

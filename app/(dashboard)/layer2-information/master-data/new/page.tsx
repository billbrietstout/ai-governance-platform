/**
 * Add Master Data Entity – inline form.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AddEntityForm } from "../AddEntityForm";

export default async function NewMasterDataEntityPage() {
  const caller = await createServerCaller();
  const [{ data: users }] = await Promise.all([caller.assets.getOrgUsers()]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer2-information/master-data" className="text-sm text-navy-600 hover:underline">
          ← Back to Master Data Registry
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Add Entity</h1>
        <p className="mt-1 text-slate-600">
          Register a new master data entity with classification and AI access policy.
        </p>
      </div>

      <AddEntityForm users={users} />
    </main>
  );
}

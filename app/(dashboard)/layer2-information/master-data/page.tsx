/**
 * Master Data Registry – entity cards with filters.
 */
import Link from "next/link";
import { Database } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";
import { MasterDataFilters } from "./MasterDataFilters";
import { MasterDataEntityCard } from "./MasterDataEntityCard";

export default async function MasterDataPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const caller = await createServerCaller();
  const [{ data }, { data: users }] = await Promise.all([
    caller.layer2.getMasterDataEntities({
      entityType: params.type && params.type !== "ALL" ? (params.type as "CUSTOMER" | "PRODUCT" | "VENDOR" | "EMPLOYEE" | "FINANCE" | "LOCATION" | "OTHER") : undefined,
      classification: params.classification && params.classification !== "ALL" ? (params.classification as "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED") : undefined,
      aiAccessPolicy: params.aiAccess && params.aiAccess !== "ALL" ? (params.aiAccess as "OPEN" | "GOVERNED" | "RESTRICTED" | "PROHIBITED") : undefined
    }),
    caller.assets.getOrgUsers()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Master Data Registry</h1>
          <p className="mt-1 text-slate-600">
            Master data entities with classification, stewardship, and AI access policies.
          </p>
        </div>
        <Link
          href="/layer2-information/master-data/new"
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
        >
          Add Entity
        </Link>
      </div>

      <MasterDataFilters />

      {data.length === 0 ? (
        <EmptyState
          title="No master data entities"
          description="Add master data entities to track classification, stewardship, and AI access policies."
          ctaLabel="Add Entity"
          ctaHref="/layer2-information/master-data/new"
          icon={<Database className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((entity) => (
            <MasterDataEntityCard key={entity.id} entity={entity} users={users} />
          ))}
        </div>
      )}
    </main>
  );
}

/**
 * AI Use Case Library – common use cases with pre-built governance templates.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import type { VerticalKey } from "@/lib/vertical-regulations";
import {
  getCatalogVerticalFilterOptions,
  getOrgVerticalFilterOptions
} from "@/lib/use-cases/org-vertical-filter";
import { USE_CASES } from "@/lib/use-cases/catalog";
import { UseCaseLibraryClient } from "./UseCaseLibraryClient";

export default async function UseCaseLibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const caller = await createServerCaller();
  const orgCtx = await caller.discovery.getOrgContext();
  const clientVerticals = (orgCtx.data.clientVerticals ?? []) as VerticalKey[];
  const verticalFilterOptions =
    clientVerticals.length > 0
      ? getOrgVerticalFilterOptions(clientVerticals)
      : getCatalogVerticalFilterOptions(USE_CASES);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          AI Use Case Library
        </h1>
        <p className="mt-1 text-slate-600">
          Common AI use cases with pre-built governance templates.
        </p>
      </div>

      <UseCaseLibraryClient useCases={USE_CASES} verticalFilterOptions={verticalFilterOptions} />
    </main>
  );
}

/**
 * Asset creation form – all AIAsset fields with inline validation.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { CreateAssetForm } from "./CreateAssetForm";

export default async function NewAssetPage() {
  const caller = await createServerCaller();
  const [{ data: users }, { data: entities }] = await Promise.all([
    caller.assets.getOrgUsers(),
    caller.layer2.getMasterDataEntities({})
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer3-application/assets" className="text-sm text-navy-400 hover:underline">
          ← Asset Inventory
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New Asset</h1>
        <p className="mt-1 text-slatePro-300">
          Create an AI asset with EU risk classification and accountability.
        </p>
      </div>

      <CreateAssetForm
        euRequiredArticles={[]}
        users={users}
        masterDataEntities={entities}
      />
    </main>
  );
}

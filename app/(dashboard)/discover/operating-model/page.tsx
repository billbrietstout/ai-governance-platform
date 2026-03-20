/**
 * Operating Model Selector – understand shared responsibility boundaries.
 */
import { createServerCaller } from "@/lib/trpc/server-caller";
import { OperatingModelClient } from "./OperatingModelClient";

export default async function OperatingModelPage() {
  const caller = await createServerCaller();
  const { data } = await caller.discovery.getOrgContext();
  const currentModel = data.operatingModel as string | null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Operating Model Selector
        </h1>
        <p className="mt-1 text-slate-600">
          Understand your shared responsibility boundaries before deploying AI.
        </p>
      </div>

      <OperatingModelClient currentModel={currentModel} />
    </main>
  );
}

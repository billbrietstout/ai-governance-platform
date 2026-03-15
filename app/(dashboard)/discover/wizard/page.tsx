/**
 * Regulation Discovery Wizard – 4-step wizard to identify applicable regulations.
 */
import { DiscoveryWizardClient } from "./DiscoveryWizardClient";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getUseCaseById } from "@/lib/use-cases/catalog";

export default async function DiscoveryWizardPage({
  searchParams
}: {
  searchParams: Promise<{ useCase?: string }>;
}) {
  const params = await searchParams;
  const caller = await createServerCaller();
  const orgRes = await caller.discovery.getOrgContext();
  const { clientVerticals, operatingModel } = orgRes.data;
  const useCase = params.useCase ? getUseCaseById(params.useCase) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Regulation Discovery Wizard</h1>
        <p className="mt-1 text-slate-600">
          Answer a few questions to identify which regulations apply to your planned AI system.
        </p>
        {useCase && (
          <p className="mt-2 rounded border border-navy-500/30 bg-navy-500/10 px-3 py-2 text-sm text-navy-700">
            Pre-filled from use case: {useCase.name}
          </p>
        )}
      </div>

      <DiscoveryWizardClient
        defaultVerticals={clientVerticals}
        defaultOperatingModel={operatingModel}
        useCaseTemplate={useCase?.templateInputs}
      />
    </main>
  );
}

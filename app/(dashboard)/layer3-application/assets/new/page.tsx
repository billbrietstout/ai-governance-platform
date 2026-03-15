/**
 * Asset creation form – all AIAsset fields with inline validation.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { CreateAssetForm } from "./CreateAssetForm";
import { getUseCaseById } from "@/lib/use-cases/catalog";

function mapDiscoveryToAssetDefaults(inputs: Record<string, unknown>) {
  const assetType = inputs.assetType as string;
  const vertical = Array.isArray(inputs.verticals) ? (inputs.verticals as string[])[0] : undefined;
  const v = typeof vertical === "string" ? vertical : undefined;
  const verticalMarket =
    v === "FINANCIAL_SERVICES"
      ? "FINANCIAL"
      : v === "HR_SERVICES"
        ? "GENERAL"
        : v === "PUBLIC_SECTOR"
          ? "PUBLIC_SECTOR"
          : v === "HEALTHCARE"
            ? "HEALTHCARE"
            : v === "INSURANCE"
              ? "INSURANCE"
              : v === "ENERGY"
                ? "ENERGY"
                : "GENERAL";
  const autonomyMap: Record<string, string> = {
    L0: "HUMAN_ONLY",
    L1: "ASSISTED",
    L2: "ASSISTED",
    L3: "SEMI_AUTONOMOUS",
    L4: "AUTONOMOUS",
    L5: "AUTONOMOUS"
  };
  const autonomyLevel = autonomyMap[(inputs.autonomyLevel as string) ?? "L2"] ?? "ASSISTED";
  return {
    name: "",
    description: (inputs.description as string) ?? "",
    assetType: ["MODEL", "AGENT", "APPLICATION", "PIPELINE"].includes(assetType) ? assetType : "APPLICATION",
    verticalMarket,
    autonomyLevel,
    euRiskLevel: (inputs.expectedRiskLevel as string) === "High" ? "HIGH" : (inputs.expectedRiskLevel as string) === "Critical" ? "HIGH" : undefined
  };
}

function mapUseCaseToAssetDefaults(uc: { name: string; description: string; assetType: string; vertical: string; autonomyLevel: string; euRiskLevel: string }) {
  const verticalMap: Record<string, string> = {
    MANUFACTURING: "GENERAL",
    FINANCIAL: "FINANCIAL",
    HEALTHCARE: "HEALTHCARE",
    HR: "GENERAL",
    RETAIL: "RETAIL",
    CUSTOMER_SERVICE: "GENERAL"
  };
  const autonomyMap: Record<string, string> = {
    L0: "HUMAN_ONLY",
    L1: "ASSISTED",
    L2: "ASSISTED",
    L3: "SEMI_AUTONOMOUS",
    L4: "AUTONOMOUS",
    L5: "AUTONOMOUS"
  };
  const assetType = ["MODEL", "AGENT", "APPLICATION", "PIPELINE"].includes(uc.assetType) ? uc.assetType : "APPLICATION";
  return {
    name: uc.name,
    description: uc.description,
    assetType,
    verticalMarket: verticalMap[uc.vertical] ?? "GENERAL",
    autonomyLevel: autonomyMap[uc.autonomyLevel] ?? "ASSISTED",
    euRiskLevel: uc.euRiskLevel
  };
}

export default async function NewAssetPage({
  searchParams
}: {
  searchParams: Promise<{ fromDiscovery?: string; useCase?: string }>;
}) {
  const params = await searchParams;
  const caller = await createServerCaller();
  const useCase = params.useCase ? getUseCaseById(params.useCase) : null;
  const [{ data: users }, { data: entities }, discoveryRes] = await Promise.all([
    caller.assets.getOrgUsers(),
    caller.layer2.getMasterDataEntities({}),
    params.fromDiscovery
      ? caller.discovery.getDiscovery({ id: params.fromDiscovery }).catch(() => null)
      : Promise.resolve(null)
  ]);

  const defaults = useCase
    ? mapUseCaseToAssetDefaults(useCase)
    : discoveryRes?.data?.inputs && params.fromDiscovery
      ? mapDiscoveryToAssetDefaults(discoveryRes.data.inputs as Record<string, unknown>)
      : undefined;

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
        {defaults && (
          <p className="mt-2 rounded border border-navy-500/30 bg-navy-500/10 px-3 py-2 text-sm text-navy-300">
            Pre-filled from {useCase ? "Use Case Library" : "Regulation Discovery"}. Review and adjust as needed.
          </p>
        )}
      </div>

      <CreateAssetForm
        euRequiredArticles={[]}
        users={users}
        masterDataEntities={entities}
        defaults={defaults}
      />
    </main>
  );
}

/**
 * Supply Chain Risk Scoring – aggregate risk per vendor.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { RiskScoreClient } from "./RiskScoreClient";

export default async function RiskScorePage() {
  const caller = await createServerCaller();
  const [scoresRes, overallRes] = await Promise.all([
    caller.supplyChain.getSupplyChainRiskScores(),
    caller.supplyChain.getOverallSupplyChainRisk()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/layer5-supply-chain" className="text-sm text-navy-600 hover:underline">
          ← Supply Chain
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Supply Chain Risk Scoring
        </h1>
        <p className="mt-1 text-slate-600">
          Aggregate risk score per vendor based on evidence, contracts, and scan coverage.
        </p>
      </div>

      <RiskScoreClient
        scores={scoresRes.data}
        overall={overallRes.data}
      />
    </main>
  );
}

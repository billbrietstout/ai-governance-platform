/**
 * Layer 1 – Business – Executive Dashboard with role-based views.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ExecutiveDashboard } from "./ExecutiveDashboard";

export default async function Layer1BusinessPage() {
  const caller = await createServerCaller();

  const [ceoRes, cfoRes, cooRes, cisoRes, legalRes, portfolioRes] = await Promise.all([
    caller.executiveDashboard.getCEOView(),
    caller.executiveDashboard.getCFOView(),
    caller.executiveDashboard.getCOOView(),
    caller.executiveDashboard.getCISOView(),
    caller.executiveDashboard.getLegalCLOView(),
    caller.executiveDashboard.getVerticalPortfolio()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Layer 1: Business</h1>
          <p className="mt-1 text-slate-600">
            Executive dashboard, regulatory cascade, and governance oversight.
          </p>
        </div>
        <Link
          href="/layer1-business/regulatory-cascade"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          Regulatory Cascade →
        </Link>
      </div>

      <ExecutiveDashboard
        ceo={ceoRes.data}
        cfo={cfoRes.data}
        coo={cooRes.data}
        ciso={cisoRes.data}
        legal={legalRes.data}
        portfolio={portfolioRes.data}
      />
    </main>
  );
}

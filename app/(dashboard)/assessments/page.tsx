/**
 * Assessment list.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";

export default async function AssessmentsPage() {
  const caller = await createServerCaller();
  const { data } = await caller.assessment.list();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
          <p className="text-slatePro-300 mt-1">Compliance assessment workflow.</p>
        </div>
        <Link
          href="/assessments/new"
          className="bg-navy-600 hover:bg-navy-500 rounded px-3 py-1.5 text-sm font-medium text-white"
        >
          New Assessment
        </Link>
      </div>

      <div className="border-slatePro-700 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-slatePro-700 bg-slatePro-900/50 border-b">
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Name</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Asset</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Status</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <div className="p-6">
                    <EmptyState
                      title="No assessments yet"
                      description="Run compliance assessments against your AI assets to track framework coverage."
                      ctaLabel="New Assessment"
                      ctaHref="/assessments/new"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((a) => (
                <tr key={a.id} className="border-slatePro-800 border-b last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="text-navy-400 font-medium hover:underline"
                    >
                      {a.name}
                    </Link>
                  </td>
                  <td className="text-slatePro-200 px-4 py-2">
                    <Link
                      href={`/layer3-application/assets/${a.asset.id}`}
                      className="text-navy-400 hover:underline"
                    >
                      {a.asset.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs ${
                        a.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : a.status === "PENDING_REVIEW"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slatePro-600/30 text-slatePro-300"
                      }`}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-slatePro-400 px-4 py-2">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/**
 * Assessment list.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssessmentsListClient } from "@/components/assessments/AssessmentsListClient";

export default async function AssessmentsPage() {
  const caller = await createServerCaller();
  const { data, meta } = await caller.assessment.list({ limit: 25 });

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Assessments"
        subtitle="Compliance assessment workflow."
        actions={
          <Link
            href="/assessments/new"
            className="bg-navy-600 hover:bg-navy-500 focus-visible:ring-navy-500 rounded px-3 py-1.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            New Assessment
          </Link>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          description="Run compliance assessments against your AI assets to track framework coverage."
          ctaLabel="New Assessment"
          ctaHref="/assessments/new"
        />
      ) : (
        <AssessmentsListClient
          initialRows={data}
          initialNextCursor={meta.nextCursor ?? null}
          totalCount={meta.totalCount ?? data.length}
        />
      )}
    </main>
  );
}

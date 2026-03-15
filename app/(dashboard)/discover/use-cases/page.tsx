/**
 * AI Use Case Library – common use cases with pre-built governance templates.
 */
import { UseCaseLibraryClient } from "./UseCaseLibraryClient";
import { USE_CASES } from "@/lib/use-cases/catalog";

export default function UseCaseLibraryPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">AI Use Case Library</h1>
        <p className="mt-1 text-slate-600">
          Common AI use cases with pre-built governance templates.
        </p>
      </div>

      <UseCaseLibraryClient useCases={USE_CASES} />
    </main>
  );
}

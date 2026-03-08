export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slatePro-50">
        AI Governance Platform
      </h1>
      <p className="max-w-prose text-slatePro-200">
        Scaffolded Next.js 14 App Router project with Prisma, Auth, tRPC, Zod,
        Sentry, and OpenTelemetry plumbing. Business logic intentionally not
        implemented yet.
      </p>
    </main>
  );
}

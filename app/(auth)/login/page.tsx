"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slatePro-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slatePro-50">
          AI Posture
        </h1>
        <p className="mt-1 text-sm text-slatePro-400">AI Readiness & Governance</p>

        <button
          type="button"
          onClick={() => signIn("auth0", { callbackUrl })}
          className="mt-8 w-full rounded-lg bg-navy-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 focus:ring-offset-slatePro-950"
        >
          Sign in with Auth0
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-dvh items-center justify-center bg-slatePro-950 px-4">
        <div className="w-full max-w-sm rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-8">
          <div className="h-8 w-48 animate-pulse rounded bg-slatePro-700/60" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slatePro-700/40" />
          <div className="mt-8 h-12 w-full animate-pulse rounded-lg bg-slatePro-700/60" />
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <main className="bg-slatePro-950 flex min-h-dvh items-center justify-center px-4">
      <div className="border-slatePro-700 bg-slatePro-900/50 w-full max-w-sm rounded-lg border p-8 shadow-xl">
        <h1 className="text-slatePro-50 text-2xl font-semibold tracking-tight">
          AI Readiness Platform
        </h1>
        <p className="text-slatePro-400 mt-1 text-sm">Readiness & oversight</p>

        <button
          type="button"
          onClick={() => signIn("auth0", { callbackUrl })}
          className="bg-navy-600 hover:bg-navy-500 focus:ring-navy-500 focus:ring-offset-slatePro-950 mt-8 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          Sign in with Auth0
        </button>

        <p className="text-slatePro-400 mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-navy-400 hover:text-navy-300 font-medium hover:underline"
          >
            Start free →
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slatePro-950 flex min-h-dvh items-center justify-center px-4">
          <div className="border-slatePro-700 bg-slatePro-900/50 w-full max-w-sm rounded-lg border p-8">
            <div className="bg-slatePro-700/60 h-8 w-48 animate-pulse rounded" />
            <div className="bg-slatePro-700/40 mt-2 h-4 w-32 animate-pulse rounded" />
            <div className="bg-slatePro-700/60 mt-8 h-12 w-full animate-pulse rounded-lg" />
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

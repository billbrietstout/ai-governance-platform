"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

const TRUST_BADGES = [
  "No credit card required",
  "CoSAI framework aligned",
  "Free forever"
];

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slatePro-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slatePro-50">
          Start your free AI readiness assessment
        </h1>
        <p className="mt-1 text-sm text-slatePro-400">
          Free forever for up to 10 AI assets
        </p>

        <button
          type="button"
          onClick={() =>
            signIn("auth0", {
              callbackUrl: "/onboarding",
              screen_hint: "signup"
            })
          }
          className="mt-8 w-full rounded-lg bg-navy-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 focus:ring-offset-slatePro-950"
        >
          Sign up with Auth0
        </button>

        <p className="mt-6 text-center text-sm text-slatePro-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy-400 hover:text-navy-300 hover:underline">
            Sign in →
          </Link>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-slatePro-600 bg-slatePro-800/50 px-3 py-1 text-xs text-slatePro-400"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

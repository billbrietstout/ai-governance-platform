"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

const TRUST_BADGES = ["No credit card required", "CoSAI framework aligned", "Free forever"];

export default function RegisterPage() {
  return (
    <main className="bg-slatePro-950 flex min-h-dvh items-center justify-center px-4">
      <div className="border-slatePro-700 bg-slatePro-900/50 w-full max-w-sm rounded-lg border p-8 shadow-xl">
        <h1 className="text-slatePro-50 text-2xl font-semibold tracking-tight">
          Start your free AI readiness assessment
        </h1>
        <p className="text-slatePro-400 mt-1 text-sm">Free forever for up to 10 AI assets</p>

        <button
          type="button"
          onClick={() =>
            signIn("auth0", {
              callbackUrl: "/onboarding",
              screen_hint: "signup"
            })
          }
          className="bg-navy-600 hover:bg-navy-500 focus:ring-navy-500 focus:ring-offset-slatePro-950 mt-8 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          Sign up with Auth0
        </button>

        <p className="text-slatePro-400 mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-navy-400 hover:text-navy-300 font-medium hover:underline"
          >
            Sign in →
          </Link>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="border-slatePro-600 bg-slatePro-800/50 text-slatePro-400 rounded-full border px-3 py-1 text-xs"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

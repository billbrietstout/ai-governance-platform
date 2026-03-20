import Link from "next/link";
import { ShieldLogo } from "@/components/ui/ShieldLogo";

export default function MfaRequiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <ShieldLogo className="text-navy-600 h-12 w-12" />
        </div>

        <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">
          Multi-Factor Authentication Required
        </h1>

        <p className="mt-3 text-center text-sm text-slate-600">
          Your account role requires multi-factor authentication. You&apos;ll need to set up an
          authenticator app (such as Google Authenticator, Authy, or 1Password) to continue.
        </p>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Click the button below to sign in again. You&apos;ll be prompted to enroll in MFA during
            the sign-in process.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/api/auth/signin/auth0"
            className="bg-navy-600 hover:bg-navy-500 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          >
            Set Up MFA & Sign In
          </Link>
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

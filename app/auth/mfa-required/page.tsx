/**
 * MFA required – ADMIN and CAIO must enable MFA.
 */
export default function MfaRequiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">MFA Required</h1>
      <p className="text-slate-400">
        Your role requires multi-factor authentication. Please enable MFA in your identity provider
        settings.
      </p>
    </main>
  );
}

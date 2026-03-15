/**
 * Onboarding layout – minimal full-page, no sidebar.
 */
import Link from "next/link";
import { ShieldLogo } from "@/components/ui/ShieldLogo";

export default function OnboardingLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/onboarding" className="flex items-center gap-2">
          <ShieldLogo className="h-8 w-8 text-navy-500" />
          <span className="text-lg font-semibold text-slate-900">AI Governance Platform</span>
        </Link>
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

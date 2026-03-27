/**
 * Organization Settings – client verticals and org configuration.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  VERTICAL_REGULATIONS,
  ALL_VERTICAL_KEYS,
  type VerticalKey
} from "@/lib/vertical-regulations";
import { ClientVerticalsForm } from "./ClientVerticalsForm";
import { ResetOnboardingForm } from "./ResetOnboardingForm";

export default async function OrganizationSettingsPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string; role?: string } | undefined;
  if (!user?.orgId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: { clientVerticals: true }
  });

  const clientVerticals = (org?.clientVerticals as string[] | null) ?? [];

  const verticalOptions = ALL_VERTICAL_KEYS.map((key) => ({
    key,
    label: VERTICAL_REGULATIONS[key]?.label ?? key,
    description: VERTICAL_REGULATIONS[key]?.description ?? "",
    regulations: VERTICAL_REGULATIONS[key]?.regulations ?? []
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-navy-600 text-sm hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Organization</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure your organization&apos;s client verticals and regulatory scope.
        </p>
      </div>

      <ClientVerticalsForm
        currentVerticals={clientVerticals as VerticalKey[]}
        verticalOptions={verticalOptions}
      />

      <ResetOnboardingForm />
    </main>
  );
}

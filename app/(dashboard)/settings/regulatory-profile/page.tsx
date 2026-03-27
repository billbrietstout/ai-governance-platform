/**
 * Regulatory Profile – vertical selection and applicable regulations.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  VERTICAL_REGULATIONS,
  orgVerticalToKey,
  type VerticalKey
} from "@/lib/vertical-regulations";
import { RegulatoryProfileForm } from "./RegulatoryProfileForm";

const VERTICAL_OPTIONS: { value: string; label: string }[] = [
  { value: "GENERAL", label: "General (Manufacturing/Retail)" },
  { value: "FINANCIAL", label: "Financial Services" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "PUBLIC_SECTOR", label: "Public Sector" },
  { value: "ENERGY", label: "Energy" },
  { value: "RETAIL", label: "Retail" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "AUTOMOTIVE", label: "Automotive" }
];

export default async function RegulatoryProfilePage() {
  const session = await auth();
  const user = session?.user as { orgId?: string; role?: string } | undefined;
  if (!user?.orgId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: { verticalMarket: true }
  });

  const verticalKey = orgVerticalToKey(org?.verticalMarket ?? null);
  const profile = VERTICAL_REGULATIONS[verticalKey];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-navy-600 text-sm hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Regulatory Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Set your industry vertical to surface relevant compliance requirements.
        </p>
      </div>

      <RegulatoryProfileForm
        currentVertical={org?.verticalMarket ?? "GENERAL"}
        verticalOptions={VERTICAL_OPTIONS}
      />

      {profile && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Regulations for {profile.label}</h2>
          <p className="mt-1 text-xs text-slate-500">{profile.description}</p>
          <ul className="mt-3 space-y-2">
            {profile.regulations.map((r) => (
              <li
                key={r.code}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-slate-900">{r.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {r.code} · {r.jurisdiction}
                  </span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    r.mandatory ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.mandatory ? "Mandatory" : "Recommended"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

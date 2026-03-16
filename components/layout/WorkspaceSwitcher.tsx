"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { switchWorkspaceAction } from "@/app/(dashboard)/consultant/actions";

type Workspace = { id: string; clientOrgId: string; clientName: string };

export function WorkspaceSwitcher({
  currentOrgId,
  orgName,
  consultantOrgId,
  consultantWorkspaces,
  consultantOrgName
}: {
  currentOrgId: string;
  orgName: string | null;
  consultantOrgId: string;
  consultantWorkspaces: Workspace[];
  consultantOrgName: string;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName =
    currentOrgId === consultantOrgId ? consultantOrgName : orgName ?? "Client";

  const handleSwitch = useCallback(
    async (targetOrgId: string) => {
      setLoading(true);
      setOpen(false);
      try {
        const result = await switchWorkspaceAction(targetOrgId);
        await update({ orgId: result.orgId });
        router.refresh();
        window.location.href = "/dashboard";
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    },
    [update, router]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex w-full items-center justify-between gap-1 rounded-lg px-3 py-2 text-left text-sm text-slatePro-200 hover:bg-slatePro-800 disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">Viewing: {displayName}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slatePro-400" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-lg border border-slatePro-700 bg-slatePro-900 py-1 shadow-xl"
            role="listbox"
          >
            <button
              type="button"
              onClick={() => handleSwitch(consultantOrgId)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slatePro-800 ${
                currentOrgId === consultantOrgId
                  ? "bg-slatePro-800/50 text-navy-300"
                  : "text-slatePro-200"
              }`}
              role="option"
            >
              My organization
            </button>
            {consultantWorkspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSwitch(w.clientOrgId)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slatePro-800 ${
                  currentOrgId === w.clientOrgId
                    ? "bg-slatePro-800/50 text-navy-300"
                    : "text-slatePro-200"
                }`}
                role="option"
              >
                {w.clientName}
              </button>
            ))}
            <Link
              href="/consultant/new"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-400 hover:bg-slatePro-800 hover:text-navy-300"
            >
              <Plus className="h-4 w-4" />
              Add new client +
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

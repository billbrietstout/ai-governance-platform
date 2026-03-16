"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/lib/hooks/useWorkspaceContext";

type Workspace = { id: string; clientOrgId: string; clientName: string };

export function WorkspaceSwitcher({
  consultantOrgId,
  consultantOrgName,
  consultantWorkspaces,
  activeWorkspaceOrgId
}: {
  consultantOrgId: string;
  consultantOrgName: string;
  consultantWorkspaces: Workspace[];
  activeWorkspaceOrgId: string | null;
}) {
  const router = useRouter();
  const { setWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(false);

  const displayName = activeWorkspaceOrgId
    ? consultantWorkspaces.find((w) => w.clientOrgId === activeWorkspaceOrgId)?.clientName ??
      "Client"
    : consultantOrgName;

  const handleSelect = (orgId: string | null, name: string | null) => {
    setOpen(false);
    setWorkspace(orgId, name);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-1 rounded-lg px-3 py-2 text-left text-sm text-slatePro-200 hover:bg-slatePro-800"
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
            className="absolute left-0 top-full z-50 mt-1 w-full min-w-0 overflow-hidden rounded-lg border border-slatePro-700 bg-slatePro-900 py-1 shadow-xl"
            role="listbox"
          >
            <button
              type="button"
              onClick={() => handleSelect(null, null)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slatePro-800 ${
                !activeWorkspaceOrgId ? "bg-slatePro-800/50 text-navy-300" : "text-slatePro-200"
              }`}
              role="option"
            >
              My organization
            </button>
            {consultantWorkspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSelect(w.clientOrgId, w.clientName)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slatePro-800 ${
                  activeWorkspaceOrgId === w.clientOrgId
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

"use client";

import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/lib/hooks/useWorkspaceContext";

export function SwitchWorkspaceButton({
  clientOrgId,
  clientName,
  children
}: {
  clientOrgId: string;
  clientName: string;
  children: React.ReactNode;
}) {
  const { setWorkspace } = useWorkspaceStore();
  const router = useRouter();

  const handleClick = () => {
    setWorkspace(clientOrgId, clientName);
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700"
    >
      {children}
    </button>
  );
}

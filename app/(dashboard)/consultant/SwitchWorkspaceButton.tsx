"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { switchWorkspaceAction } from "./actions";

export function SwitchWorkspaceButton({
  clientOrgId,
  children
}: {
  clientOrgId: string;
  children: React.ReactNode;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await switchWorkspaceAction(clientOrgId);
      await update({ orgId: result.orgId });
      router.refresh();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-700 disabled:opacity-50"
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

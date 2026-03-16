"use client";

import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/lib/hooks/useWorkspaceContext";

export function WorkspaceContextBanner({
  activeWorkspaceName
}: {
  activeWorkspaceName: string | null;
}) {
  const router = useRouter();
  const { clearWorkspace } = useWorkspaceStore();

  if (!activeWorkspaceName) return null;

  const handleBack = () => {
    clearWorkspace();
    router.push("/consultant");
    router.refresh();
  };

  return (
    <div className="mx-3 mb-3 rounded-lg border border-amber-700/50 bg-amber-900/30 p-3">
      <div className="text-xs font-medium text-amber-400">Consultant view</div>
      <div className="mt-0.5 truncate text-sm font-medium text-amber-100">
        {activeWorkspaceName}
      </div>
      <button
        type="button"
        onClick={handleBack}
        className="mt-1 text-xs text-amber-400 hover:text-amber-300"
      >
        ← Back to my workspaces
      </button>
    </div>
  );
}

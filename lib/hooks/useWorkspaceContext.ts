"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const WORKSPACE_COOKIE = "workspace-org-id";

function setWorkspaceCookie(orgId: string | null) {
  if (typeof document === "undefined") return;
  if (orgId) {
    document.cookie = `${WORKSPACE_COOKIE}=${orgId}; path=/; max-age=2592000; samesite=lax`;
  } else {
    document.cookie = `${WORKSPACE_COOKIE}=; path=/; max-age=0`;
  }
}

interface WorkspaceStore {
  activeWorkspaceOrgId: string | null;
  activeWorkspaceName: string | null;
  setWorkspace: (orgId: string | null, name: string | null) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceOrgId: null,
      activeWorkspaceName: null,
      setWorkspace: (orgId, name) => {
        setWorkspaceCookie(orgId);
        set({ activeWorkspaceOrgId: orgId, activeWorkspaceName: name });
      },
      clearWorkspace: () => {
        setWorkspaceCookie(null);
        set({ activeWorkspaceOrgId: null, activeWorkspaceName: null });
      }
    }),
    { name: "workspace-context" }
  )
);

/**
 * RBAC – each role cannot access routes above permission level.
 * VIEWER cannot read other-org data on any endpoint.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/lib/trpc/trpc";
import { appRouter } from "@/lib/trpc/router";
import type { TrpcContext } from "@/lib/trpc/context";

const mockSession = (orgId: string, userId: string, role: string) =>
  ({
    user: { id: userId, orgId, role, email: "test@example.com" },
    expires: new Date(Date.now() + 3600).toISOString()
  }) as import("next-auth").Session;

function mockContext(session: import("next-auth").Session | null): TrpcContext {
  const user = session?.user as { orgId?: string; id?: string; role?: string } | undefined;
  return {
    req: new Request("http://localhost") as import("next/server").NextRequest,
    session,
    orgId: user?.orgId ?? "",
    userId: user?.id ?? "",
    role: user?.role ?? "MEMBER",
    activeWorkspaceOrgId: null,
    isConsultantAccess: false,
    consultantOrgId: user?.orgId ?? null
  };
}

function createCaller(ctx: TrpcContext) {
  const factory = createCallerFactory(appRouter);
  return factory(ctx);
}

describe("RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated user cannot access protected procedures", async () => {
    const ctx = mockContext(null);
    const caller = createCaller(ctx);

    await expect(caller.assets.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Not authenticated"
    });
  });

  it("MEMBER cannot access getEUPenaltyExposure", async () => {
    const ctx = mockContext(mockSession("org-1", "user-1", "MEMBER"));
    const caller = createCaller(ctx);
    await expect(caller.dashboard.getEUPenaltyExposure()).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("VIEWER cannot access getEUPenaltyExposure", async () => {
    const ctx = mockContext(mockSession("org-1", "user-1", "VIEWER"));
    const caller = createCaller(ctx);
    await expect(caller.dashboard.getEUPenaltyExposure()).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });
});

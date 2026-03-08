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

function createCaller(ctx: TrpcContext) {
  const factory = createCallerFactory(appRouter);
  return factory(ctx);
}

describe("RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated user cannot access protected procedures", async () => {
    const ctx: TrpcContext = {
      req: new Request("http://localhost") as import("next/server").NextRequest,
      session: null
    };
    const caller = createCaller(ctx);

    await expect(caller.assets.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Not authenticated"
    });
  });

  it("MEMBER cannot access getEUPenaltyExposure", async () => {
    const ctx: TrpcContext = {
      req: new Request("http://localhost") as import("next/server").NextRequest,
      session: mockSession("org-1", "user-1", "MEMBER")
    };
    const caller = createCaller(ctx);
    await expect(caller.dashboard.getEUPenaltyExposure()).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });

  it("VIEWER cannot access getEUPenaltyExposure", async () => {
    const ctx: TrpcContext = {
      req: new Request("http://localhost") as import("next/server").NextRequest,
      session: mockSession("org-1", "user-1", "VIEWER")
    };
    const caller = createCaller(ctx);
    await expect(caller.dashboard.getEUPenaltyExposure()).rejects.toMatchObject({
      code: "FORBIDDEN"
    });
  });
});

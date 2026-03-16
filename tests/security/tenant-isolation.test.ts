/**
 * Tenant isolation – Org A cannot reach Org B via API, tRPC, search, export.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/lib/trpc/trpc";
import { appRouter } from "@/lib/trpc/router";
import type { TrpcContext } from "@/lib/trpc/context";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIAsset: {
      findMany: vi.fn(),
      findFirst: vi.fn()
    }
  }
}));

vi.mock("@/lib/compliance/engine", () => ({
  calculateComplianceScore: vi.fn().mockResolvedValue({ percentage: 0 })
}));

const mockSession = (orgId: string, userId: string, role: string) =>
  ({
    user: { id: userId, orgId, role, email: "test@example.com" },
    expires: new Date(Date.now() + 3600).toISOString()
  }) as import("next-auth").Session;

function mockContext(session: import("next-auth").Session): TrpcContext {
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

describe("Tenant isolation", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/lib/prisma");
    (prisma.aIAsset.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.aIAsset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("org A caller listing assets receives only org A data", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.aIAsset.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "asset-a1", name: "Asset A1", orgId: "org-a" }
    ]);

    const ctx = mockContext(mockSession("org-a", "user-a", "MEMBER"));
    const caller = createCaller(ctx);
    const result = await caller.assets.list();

    expect(prisma.aIAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orgId: "org-a" })
      })
    );
    expect(result.data).toBeDefined();
  });

  it("org A caller cannot get asset belonging to org B", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.aIAsset.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const ctx = mockContext(mockSession("org-a", "user-a", "MEMBER"));
    const caller = createCaller(ctx);

    await expect(caller.assets.get({ id: "asset-b1" })).rejects.toMatchObject({
      code: "NOT_FOUND"
    });

    expect(prisma.aIAsset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "asset-b1", orgId: "org-a", deletedAt: null }
      })
    );
  });
});

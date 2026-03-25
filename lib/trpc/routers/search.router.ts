import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const STATIC_PAGES = [
  { href: "/dashboard", label: "Posture Overview", category: "pages" },
  { href: "/maturity", label: "Maturity Assessment", category: "pages" },
  { href: "/reports", label: "Reports", category: "pages" },
  { href: "/compliance/snapshots", label: "Snapshots", category: "pages" },
  { href: "/compliance/regulation-feed", label: "Regulation Watch", category: "pages" },
  { href: "/compliance/iso42001", label: "ISO 42001", category: "pages" },
  { href: "/compliance/eu-ai-act", label: "EU AI Act Conformity", category: "pages" },
  { href: "/compliance/aivss", label: "OWASP AIVSS", category: "pages" },
  { href: "/audit-package", label: "Audit Package", category: "pages" },
  { href: "/audit", label: "Audit Log", category: "pages" },
  { href: "/discover", label: "Regulation Discovery", category: "pages" },
  { href: "/discover/use-cases", label: "Use Case Library", category: "pages" },
  { href: "/layer1-business", label: "L1 Business Overview", category: "pages" },
  { href: "/layer3-application/assets", label: "AI Assets", category: "pages" },
  { href: "/layer3-application/agents", label: "Agentic Registry", category: "pages" },
  { href: "/layer5-supply-chain", label: "Model Registry", category: "pages" },
  { href: "/layer5-supply-chain/vendors", label: "Vendors", category: "pages" }
];

export const searchRouter = createTRPCRouter({
  globalSearch: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const q = input.query.toLowerCase().trim();
      if (!q)
        return {
          data: { assets: [], vendors: [], regulations: [], useCases: [], pages: [] },
          meta: {}
        };

      const [assets, vendors] = await Promise.all([
        prisma.aIAsset.findMany({
          where: { orgId: ctx.orgId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
          select: { id: true, name: true },
          take: 10
        }),
        prisma.vendorAssurance.findMany({
          where: { orgId: ctx.orgId, vendorName: { contains: q, mode: "insensitive" } },
          select: { id: true, vendorName: true },
          take: 10
        })
      ]);

      const pages = STATIC_PAGES.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 10);

      return {
        data: {
          assets: assets.map((a) => ({
            id: a.id,
            label: a.name,
            href: `/layer3-application/assets/${a.id}`,
            category: "assets" as const
          })),
          vendors: vendors.map((v) => ({
            id: v.id,
            label: v.vendorName,
            href: `/layer5-supply-chain/vendors/${v.id}`,
            category: "vendors" as const
          })),
          regulations: [] as { id: string; label: string; href: string; category: "regulations" }[],
          useCases: [] as { id: string; label: string; href: string; category: "useCases" }[],
          pages: pages.map((p) => ({
            id: p.href,
            label: p.label,
            href: p.href,
            category: "pages" as const
          }))
        },
        meta: {}
      };
    })
});

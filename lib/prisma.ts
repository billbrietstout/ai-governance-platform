import { PrismaClient } from "@prisma/client";

import { createTenantMiddleware } from "@/lib/tenant";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

client.$use(createTenantMiddleware());

export const prisma = client;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


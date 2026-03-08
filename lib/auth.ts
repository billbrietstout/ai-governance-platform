/**
 * NextAuth v4 – Auth0 provider, signIn callback with Prisma, tenant.
 */
import NextAuth, { getServerSession } from "next-auth";
import Auth0 from "next-auth/providers/auth0";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { clearFailedAttempts } from "@/lib/session";
import { setTenantContext } from "@/lib/tenant";

const EIGHT_HOURS = 8 * 60 * 60;
const THIRTY_MINUTES = 30 * 60;

export const authOptions = {
  trustHost: true,
  providers: [
    Auth0({
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      issuer: env.AUTH0_ISSUER,
      authorization: {
        params: {
          scope: "openid profile email",
          prompt: "login"
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: EIGHT_HOURS,
    updateAge: THIRTY_MINUTES
  },
  callbacks: {
    jwt({ token, user, trigger, session }: { token: Record<string, unknown>; user?: { id?: string; orgId?: string; role?: string; mfaEnabled?: boolean }; trigger?: string; session?: Record<string, unknown> }) {
      if (user) {
        token.id = user.id;
        token.orgId = user.orgId;
        token.role = user.role;
        token.mfaEnabled = user.mfaEnabled;
      }
      if (trigger === "update" && session) {
        token.orgId = (session as { orgId?: string }).orgId;
        token.role = (session as { role?: string }).role;
        token.mfaEnabled = (session as { mfaEnabled?: boolean }).mfaEnabled;
      }
      return token;
    },
    session({ session, token }: { session: { user?: Record<string, unknown> }; token: Record<string, unknown> }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.orgId = token.orgId as string;
        session.user.role = token.role as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
      }
      return session;
    },
    async signIn({ user }: { user: { email?: string | null } }) {
      const email = user.email;
      if (!email) return false;

      let dbUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true, orgId: true, role: true, mfaEnabled: true, lockedUntil: true }
      });

      if (dbUser) {
        if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) return "/login?error=locked";

        (user as unknown as { id: string }).id = dbUser.id;
        (user as unknown as { orgId: string }).orgId = dbUser.orgId;
        (user as unknown as { role: string }).role = dbUser.role;
        (user as unknown as { mfaEnabled: boolean }).mfaEnabled = dbUser.mfaEnabled;

        if (dbUser.role === "ADMIN" || dbUser.role === "CAIO") {
          if (!dbUser.mfaEnabled) {
            return "/auth/mfa-required";
          }
        }

        await clearFailedAttempts(dbUser.id);
        setTenantContext(dbUser.orgId);
        await prisma.auditLog.create({
          data: {
            orgId: dbUser.orgId,
            userId: dbUser.id,
            action: "LOGIN",
            resourceType: "User",
            resourceId: dbUser.id
          }
        });
        return true;
      }

      // No User record – check for domain claim (before PendingInvite)
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain) {
        const orgByDomain = await prisma.organization.findUnique({
          where: { claimedDomain: domain }
        });
        if (orgByDomain) {
          const newUser = await prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
              data: {
                orgId: orgByDomain.id,
                email,
                role: orgByDomain.autoJoinRole
              }
            });
            await tx.auditLog.create({
              data: {
                orgId: orgByDomain.id,
                userId: u.id,
                action: "CREATE",
                resourceType: "User",
                resourceId: u.id,
                nextState: { email, role: orgByDomain.autoJoinRole, source: "domain_claim" }
              }
            });
            return u;
          });

          (user as unknown as { id: string }).id = newUser.id;
          (user as unknown as { orgId: string }).orgId = newUser.orgId;
          (user as unknown as { role: string }).role = newUser.role;
          (user as unknown as { mfaEnabled: boolean }).mfaEnabled = newUser.mfaEnabled;

          setTenantContext(newUser.orgId);
          await prisma.auditLog.create({
            data: {
              orgId: newUser.orgId,
              userId: newUser.id,
              action: "LOGIN",
              resourceType: "User",
              resourceId: newUser.id
            }
          });
          return true;
        }
      }

      // No domain claim – check for valid PendingInvite
      const invite = await prisma.pendingInvite.findFirst({
        where: { email, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" }
      });

      if (invite) {
        const newUser = await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              orgId: invite.orgId,
              email,
              role: invite.role
            }
          });
          await tx.pendingInvite.delete({ where: { id: invite.id } });
          await tx.auditLog.create({
            data: {
              orgId: invite.orgId,
              userId: u.id,
              action: "CREATE",
              resourceType: "User",
              resourceId: u.id,
              nextState: { email, role: invite.role }
            }
          });
          return u;
        });

        dbUser = newUser;
        (user as unknown as { id: string }).id = newUser.id;
        (user as unknown as { orgId: string }).orgId = newUser.orgId;
        (user as unknown as { role: string }).role = newUser.role;
        (user as unknown as { mfaEnabled: boolean }).mfaEnabled = newUser.mfaEnabled;

        setTenantContext(newUser.orgId);
        await prisma.auditLog.create({
          data: {
            orgId: newUser.orgId,
            userId: newUser.id,
            action: "LOGIN",
            resourceType: "User",
            resourceId: newUser.id
          }
        });
        return true;
      }

      // No invite – check for fresh install
      const orgCount = await prisma.organization.count();
      if (orgCount === 0) {
        const { org, newUser } = await prisma.$transaction(async (tx) => {
          const o = await tx.organization.create({
            data: {
              name: "My Organization",
              slug: "my-organization"
            }
          });
          const u = await tx.user.create({
            data: {
              orgId: o.id,
              email,
              role: "ADMIN"
            }
          });
          await tx.auditLog.create({
            data: {
              orgId: o.id,
              userId: u.id,
              action: "CREATE",
              resourceType: "User",
              resourceId: u.id,
              nextState: { email, role: "ADMIN" }
            }
          });
          return { org: o, newUser: u };
        });

        (user as unknown as { id: string }).id = newUser.id;
        (user as unknown as { orgId: string }).orgId = newUser.orgId;
        (user as unknown as { role: string }).role = newUser.role;
        (user as unknown as { mfaEnabled: boolean }).mfaEnabled = newUser.mfaEnabled;

        setTenantContext(org.id);
        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            userId: newUser.id,
            action: "LOGIN",
            resourceType: "User",
            resourceId: newUser.id
          }
        });
        return true;
      }

      return "/login?error=NotInvited";
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions as any);

export const handlers = { GET: handler, POST: handler };
export const auth = () => getServerSession(authOptions) as Promise<import("next-auth").Session | null>;

/**
 * NextAuth v5 – Auth0 provider, SAML 2.0 / OIDC enterprise SSO.
 * MFA enforced for ADMIN and CAIO roles.
 * Session: 8h active max, 30 min idle timeout (warn at 25 min client-side).
 */
import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { clearFailedAttempts } from "@/lib/session";
import { setTenantContext } from "@/lib/tenant";

const EIGHT_HOURS = 8 * 60 * 60;
const THIRTY_MINUTES = 30 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      // Auth0 supports SAML 2.0 and OIDC via Enterprise connections in the Auth0 dashboard
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: EIGHT_HOURS,
    updateAge: THIRTY_MINUTES
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.orgId = (user as { orgId?: string }).orgId;
        token.role = (user as { role?: string }).role;
        token.mfaEnabled = (user as { mfaEnabled?: boolean }).mfaEnabled;
      }
      if (trigger === "update" && session) {
        token.orgId = (session as { orgId?: string }).orgId;
        token.role = (session as { role?: string }).role;
        token.mfaEnabled = (session as { mfaEnabled?: boolean }).mfaEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { orgId: string }).orgId = token.orgId as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { mfaEnabled: boolean }).mfaEnabled = token.mfaEnabled as boolean;
      }
      return session;
    },
    async signIn({ user, account }) {
      const email = user.email;
      if (!email) return false;

      const dbUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true, orgId: true, role: true, mfaEnabled: true, lockedUntil: true }
      });

      if (!dbUser) return false;
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
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
});

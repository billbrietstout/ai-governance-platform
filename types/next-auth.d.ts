import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      orgId?: string;
      role?: string;
      mfaEnabled?: boolean;
      mfaVerified?: boolean;
      isSuperAdmin?: boolean;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

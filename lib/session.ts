/**
 * Session management – lockout, brute force detection, active sessions.
 */
import { prisma } from "@/lib/prisma";

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min
const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const BRUTE_FORCE_THRESHOLD = 3;

/**
 * Record a failed login attempt. Returns lockout state.
 */
export async function recordFailedLogin(params: {
  orgId: string;
  email: string;
  ipAddress?: string;
}): Promise<{ locked: boolean; lockedUntil?: Date }> {
  const { orgId, email, ipAddress } = params;

  const user = await prisma.user.findFirst({
    where: { orgId, email },
    select: { id: true, failedAttempts: true, lockedUntil: true }
  });

  if (!user) {
    await prisma.securityEvent.create({
      data: {
        orgId,
        email,
        eventType: "LOGIN_FAILED",
        ipAddress,
        metadata: { reason: "user_not_found" }
      }
    });
    return { locked: false };
  }

  const now = new Date();
  const lockedUntil = user.lockedUntil && user.lockedUntil > now ? user.lockedUntil : null;

  if (lockedUntil) {
    return { locked: true, lockedUntil };
  }

  const newAttempts = user.failedAttempts + 1;
  const willLock = newAttempts >= LOCKOUT_ATTEMPTS;
  const newLockedUntil = willLock ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: newAttempts,
      lockedUntil: newLockedUntil
    }
  });

  await prisma.securityEvent.create({
    data: {
      orgId,
      userId: user.id,
      email,
      eventType: "LOGIN_FAILED",
      ipAddress,
      metadata: { attempts: newAttempts, locked: willLock }
    }
  });

  if (willLock) {
    await prisma.securityEvent.create({
      data: {
        orgId,
        userId: user.id,
        email,
        eventType: "BRUTE_FORCE_DETECTED",
        ipAddress,
        metadata: { attempts: newAttempts, lockoutDuration: LOCKOUT_DURATION_MS }
      }
    });
  } else {
    const recentFailures = await prisma.securityEvent.count({
      where: {
        orgId,
        email,
        eventType: "LOGIN_FAILED",
        createdAt: { gte: new Date(now.getTime() - BRUTE_FORCE_WINDOW_MS) }
      }
    });
    if (recentFailures >= BRUTE_FORCE_THRESHOLD) {
      await prisma.securityEvent.create({
        data: {
          orgId,
          userId: user.id,
          email,
          eventType: "BRUTE_FORCE_DETECTED",
          ipAddress,
          metadata: { failuresInWindow: recentFailures, windowMs: BRUTE_FORCE_WINDOW_MS }
        }
      });
    }
  }

  return { locked: willLock, lockedUntil: newLockedUntil ?? undefined };
}

/**
 * Clear failed attempts on successful login.
 */
export async function clearFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0, lockedUntil: null }
  });
}

/**
 * Get active sessions for a user.
 */
export async function getActiveSessions(params: {
  userId: string;
  orgId: string;
}): Promise<{ id: string; expiresAt: Date; ipAddress: string | null; createdAt: Date }[]> {
  const now = new Date();
  const sessions = await prisma.session.findMany({
    where: { userId: params.userId, orgId: params.orgId, expiresAt: { gt: now } },
    select: { id: true, expiresAt: true, ipAddress: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
  return sessions;
}

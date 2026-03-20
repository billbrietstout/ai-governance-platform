/**
 * Auth0 Management API helper for syncing MFA metadata.
 * Fails silently if Management API credentials are not configured.
 */
import { env } from "@/env";

let cachedToken: { token: string; expiresAt: number } | null = null;

function getAuth0Domain(): string {
  // AUTH0_ISSUER is "https://domain/" — extract the domain
  return env.AUTH0_ISSUER.replace(/\/$/, "");
}

async function getManagementToken(): Promise<string | null> {
  if (!env.AUTH0_MGMT_CLIENT_ID || !env.AUTH0_MGMT_CLIENT_SECRET) {
    return null;
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const domain = getAuth0Domain();
  const res = await fetch(`${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: env.AUTH0_MGMT_CLIENT_ID,
      client_secret: env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `${domain}/api/v2/`
    })
  });

  if (!res.ok) {
    console.error("[auth0-mgmt] Failed to get management token:", res.status);
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    // Expire 60s early to avoid edge cases
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  };
  return cachedToken.token;
}

/**
 * Set app_metadata.requireMfa on a user's Auth0 profile.
 * Finds user by email, then patches their app_metadata.
 * Fails silently if Management API is not configured.
 */
export async function setAuth0MfaRequired(email: string, required: boolean): Promise<void> {
  try {
    const token = await getManagementToken();
    if (!token) return;

    const domain = getAuth0Domain();

    // Find user by email
    const searchRes = await fetch(
      `${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!searchRes.ok) {
      console.error("[auth0-mgmt] Failed to find user:", searchRes.status);
      return;
    }

    const users = (await searchRes.json()) as { user_id: string }[];
    if (users.length === 0) return;

    // Update app_metadata for each matching user (usually 1)
    for (const user of users) {
      const patchRes = await fetch(`${domain}/api/v2/users/${encodeURIComponent(user.user_id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          app_metadata: { requireMfa: required }
        })
      });
      if (!patchRes.ok) {
        console.error("[auth0-mgmt] Failed to update user metadata:", patchRes.status);
      }
    }
  } catch (err) {
    console.error("[auth0-mgmt] Error syncing MFA metadata:", err);
  }
}

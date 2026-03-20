"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date | string;
  createdAt: Date | string;
};

export function PendingInvitesList({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/v1/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRevoking(null);
    }
  }

  if (invites.length === 0) {
    return <p className="mt-3 text-sm text-gray-500">No pending invites.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {invites.map((inv) => {
        const expiresAt =
          typeof inv.expiresAt === "string" ? new Date(inv.expiresAt) : inv.expiresAt;
        const expired = expiresAt < new Date();
        return (
          <li
            key={inv.id}
            className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50"
          >
            <div>
              <span className="text-gray-900">{inv.email}</span>
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {inv.role}
              </span>
              {expired && <span className="ml-2 text-xs text-amber-600">(expired)</span>}
            </div>
            {!expired && (
              <button
                type="button"
                onClick={() => revoke(inv.id)}
                disabled={revoking === inv.id}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {revoking === inv.id ? "Revoking…" : "Revoke"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

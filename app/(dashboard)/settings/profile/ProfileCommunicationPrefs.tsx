"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
  emailEnabled: boolean;
  userEmail: string | null;
};

export function ProfileCommunicationPrefs({ emailEnabled, userEmail }: Props) {
  const [enabled, setEnabled] = useState(emailEnabled);
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: value })
      });
      if (res.ok) {
        setEnabled(value);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900">Communication preferences</h2>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Email notifications</p>
          <p className="text-xs text-gray-500">
            {enabled ? `Receiving at ${userEmail ?? "your email"}` : "Disabled"}
          </p>
        </div>
        <Toggle
          checked={enabled}
          onChange={handleToggle}
          size="default"
          disabled={saving}
        />
      </div>
      <Link
        href="/settings/notifications"
        className="mt-4 inline-block text-sm text-navy-600 hover:underline"
      >
        Manage all notification settings →
      </Link>
    </section>
  );
}

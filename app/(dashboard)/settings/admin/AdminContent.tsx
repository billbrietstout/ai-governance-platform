"use client";

import { useState } from "react";
import {
  setOrgTierAction,
  setOrgNotificationsEnabledAction,
  sendTestDigestToAllAction,
  setUserEmailEnabledAction
} from "./actions";
import { Toggle } from "@/components/ui/Toggle";

const TIERS = ["FREE", "PRO", "CONSULTANT", "ENTERPRISE"] as const;

type NotificationUser = {
  userId: string;
  email: string;
  emailEnabled: boolean;
  lastDigestDaysAgo: number | null;
  lastDigestLabel: string;
};

type Props = {
  currentTier: string;
  notificationStatus: NotificationUser[];
  orgNotificationsEnabled: boolean;
};

export function AdminContent({ currentTier, notificationStatus, orgNotificationsEnabled }: Props) {
  const [selectedTier, setSelectedTier] = useState<string>(currentTier);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [orgNotifEnabled, setOrgNotifEnabled] = useState(orgNotificationsEnabled);
  const [userStatus, setUserStatus] = useState(notificationStatus);

  const handleApply = async () => {
    setMessage(null);
    setPending(true);
    try {
      await setOrgTierAction(selectedTier as (typeof TIERS)[number]);
      setMessage({ type: "success", text: "Tier updated. Reloading..." });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update tier."
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">Demo tier switching and development tools.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">For demo and development only</p>
        <p className="mt-1 text-xs text-amber-700">
          Changing the subscription tier affects feature gates and limits. Use for testing only.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Subscription Tier</h2>
        <p className="mt-1 text-sm text-slate-600">Current tier: {currentTier}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          {TIERS.map((tier) => (
            <label key={tier} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="tier"
                value={tier}
                checked={selectedTier === tier}
                onChange={() => setSelectedTier(tier)}
                className="text-navy-600 focus:ring-navy-500 rounded-full border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">{tier}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={pending || selectedTier === currentTier}
          className="bg-navy-600 hover:bg-navy-500 mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Applying…" : "Apply tier"}
        </button>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Notification Management */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Notification Management</h2>
        <p className="mt-1 text-sm text-slate-600">
          Org-level controls for email notifications. Emergency kill switch stops all emails.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={async () => {
              setPending(true);
              try {
                const count = await sendTestDigestToAllAction();
                setMessage({ type: "success", text: `Test digest sent to ${count} user(s).` });
                setTimeout(() => window.location.reload(), 1500);
              } catch (err) {
                setMessage({
                  type: "error",
                  text: err instanceof Error ? err.message : "Failed to send"
                });
              } finally {
                setPending(false);
              }
            }}
            disabled={pending || !orgNotifEnabled}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send test digest to all users"}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Disable all notifications for this org</span>
            <Toggle
              checked={!orgNotifEnabled}
              onChange={async (killSwitch) => {
                setPending(true);
                try {
                  await setOrgNotificationsEnabledAction(!killSwitch);
                  setOrgNotifEnabled(!killSwitch);
                  setMessage({
                    type: "success",
                    text: killSwitch
                      ? "All org notifications disabled."
                      : "Org notifications re-enabled."
                  });
                  setTimeout(() => window.location.reload(), 1000);
                } catch (err) {
                  setMessage({
                    type: "error",
                    text: err instanceof Error ? err.message : "Failed"
                  });
                } finally {
                  setPending(false);
                }
              }}
              size="default"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700">User notification status</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Name/email</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Email enabled</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">
                    Last digest sent
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {userStatus.map((u) => (
                  <tr key={u.userId}>
                    <td className="px-4 py-2 text-slate-900">{u.email}</td>
                    <td className="px-4 py-2">{u.emailEnabled ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 text-slate-600">{u.lastDigestLabel}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await setUserEmailEnabledAction(u.userId, !u.emailEnabled);
                            setUserStatus((prev) =>
                              prev.map((x) =>
                                x.userId === u.userId ? { ...x, emailEnabled: !u.emailEnabled } : x
                              )
                            );
                          } catch {
                            setMessage({ type: "error", text: "Failed to update" });
                          }
                        }}
                        className="text-navy-600 hover:underline"
                      >
                        {u.emailEnabled ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

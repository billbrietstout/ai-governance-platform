"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Toggle } from "@/components/ui/Toggle";

type NotificationPreference = {
  id: string;
  weeklyDigest: boolean;
  weeklyDigestDay: string;
  weeklyDigestTime: string;
  complianceDropAlert: boolean;
  complianceDropThreshold: number;
  newCriticalRiskAlert: boolean;
  regulatoryDeadline90: boolean;
  regulatoryDeadline30: boolean;
  regulatoryDeadline7: boolean;
  vendorEvidenceExpiry: boolean;
  evidenceExpiryDays: number;
  shadowAiDetected: boolean;
  newUnownedHighRisk: boolean;
  failedScanAlert: boolean;
  emailEnabled: boolean;
  slackWebhookUrl: string | null;
  org?: {
    notificationsEnabled: boolean;
    slackEnabled: boolean;
    slackConfigured: boolean;
  };
};

type NotificationPreferencesFormProps = {
  initialPrefs: NotificationPreference | null;
  userEmail: string | null;
  isAdmin?: boolean;
};

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
];

const TIMES = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
];

const DEFAULT_PREFS: NotificationPreference = {
  id: "",
  weeklyDigest: true,
  weeklyDigestDay: "MONDAY",
  weeklyDigestTime: "08:00",
  complianceDropAlert: true,
  complianceDropThreshold: 10,
  newCriticalRiskAlert: true,
  regulatoryDeadline90: true,
  regulatoryDeadline30: true,
  regulatoryDeadline7: true,
  vendorEvidenceExpiry: true,
  evidenceExpiryDays: 30,
  shadowAiDetected: true,
  newUnownedHighRisk: true,
  failedScanAlert: false,
  emailEnabled: true,
  slackWebhookUrl: null,
};

export function NotificationPreferencesForm({
  initialPrefs,
  userEmail,
  isAdmin = false,
}: NotificationPreferencesFormProps) {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState<NotificationPreference>(initialPrefs ?? DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slack-specific state
  const [slackWebhookInput, setSlackWebhookInput] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(prefs.org?.slackEnabled ?? false);
  const [slackTestStatus, setSlackTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [slackSaved, setSlackSaved] = useState(false);

  // Org kill switch state
  const [orgNotificationsEnabled, setOrgNotificationsEnabled] = useState(
    prefs.org?.notificationsEnabled ?? true
  );

  const unsubscribed = searchParams.get("unsubscribed") === "true";
  const resubscribed = searchParams.get("resubscribed") === "true";

  useEffect(() => {
    if (initialPrefs) {
      setPrefs(initialPrefs);
      setSlackEnabled(initialPrefs.org?.slackEnabled ?? false);
      setOrgNotificationsEnabled(initialPrefs.org?.notificationsEnabled ?? true);
    }
  }, [initialPrefs]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  const handleSendTest = useCallback(async () => {
    setTestSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/notifications/send-test", { method: "POST" });
      if (!res.ok) throw new Error("Failed to send");
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch {
      setError("Failed to send test digest");
    } finally {
      setTestSending(false);
    }
  }, []);

  const handleOrgKillSwitch = useCallback(async (enabled: boolean) => {
    setOrgNotificationsEnabled(enabled);
    try {
      await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgNotificationsEnabled: enabled }),
      });
    } catch {
      setOrgNotificationsEnabled(!enabled); // revert on error
    }
  }, []);

  const handleSaveSlack = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlackWebhookUrl: slackWebhookInput,
          slackEnabled,
        }),
      });
      setSlackSaved(true);
      setTimeout(() => setSlackSaved(false), 3000);
    } catch {
      setError("Failed to save Slack settings");
    } finally {
      setSaving(false);
    }
  }, [slackWebhookInput, slackEnabled]);

  const handleTestSlack = useCallback(async () => {
    setSlackTestStatus("sending");
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testSlack: true,
          orgSlackWebhookUrl: slackWebhookInput || undefined,
        }),
      });
      const data = (await res.json()) as { success?: boolean };
      setSlackTestStatus(data.success ? "success" : "error");
    } catch {
      setSlackTestStatus("error");
    } finally {
      setTimeout(() => setSlackTestStatus("idle"), 4000);
    }
  }, [slackWebhookInput]);

  const toggle = (key: keyof NotificationPreference, value: boolean) => {
    if (prefs.emailEnabled || key === "emailEnabled") {
      setPrefs((p) => ({ ...p, [key]: value }));
    }
  };

  const set = (key: keyof NotificationPreference, value: string | number | null) => {
    if (prefs.emailEnabled) {
      setPrefs((p) => ({ ...p, [key]: value }));
    }
  };

  const handleMasterToggle = useCallback(async (enabled: boolean) => {
    setPrefs((p) => ({ ...p, emailEnabled: enabled }));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: enabled }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setPrefs((p) => ({ ...p, emailEnabled: !enabled }));
    } finally {
      setSaving(false);
    }
  }, []);

  const emailEnabled = prefs.emailEnabled;
  const orgKilled = !orgNotificationsEnabled;
  const disabledOpacity = "opacity-60 pointer-events-none";

  return (
    <div className="space-y-8">
      {unsubscribed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have been unsubscribed from email notifications. You can re-enable them below.
        </div>
      )}
      {resubscribed && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Email notifications have been re-enabled. You&apos;ll start receiving updates again.
        </div>
      )}

      {/* Org-level kill switch — admin only */}
      {isAdmin && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Organization email notifications
              </h2>
              <p className="mt-1 text-xs text-amber-700">
                Master switch — disabling this stops ALL emails for every user in this organization.
              </p>
              {orgKilled && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  ⚠️ All organization emails are currently disabled.
                </p>
              )}
            </div>
            <Toggle
              checked={orgNotificationsEnabled}
              onChange={handleOrgKillSwitch}
              size="large"
              disabled={saving}
            />
          </div>
        </div>
      )}

      {/* Master user toggle */}
      <div className="rounded-lg border-2 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Email notifications</h2>
            <p className="mt-1 text-sm text-slate-500">
              {orgKilled
                ? "All email notifications are disabled at the organization level."
                : emailEnabled
                ? `You are receiving email notifications at ${userEmail ?? "your email"}`
                : "All email notifications are disabled. You will not receive any emails from AI Posture Platform."}
            </p>
          </div>
          <Toggle
            checked={emailEnabled}
            onChange={handleMasterToggle}
            size="large"
            disabled={saving || orgKilled}
          />
        </div>
        {!emailEnabled && !orgKilled && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            ⓘ You can re-enable notifications at any time by toggling this back on.
          </div>
        )}
      </div>

      {/* Email delivery */}
      <section className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${!emailEnabled || orgKilled ? disabledOpacity : ""}`}>
        <h2 className="text-lg font-medium text-gray-900">Email delivery</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <p className="mt-1 text-sm text-gray-500">{userEmail ?? "—"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="digest-day" className="block text-sm font-medium text-gray-700">
                Weekly digest day
              </label>
              <select
                id="digest-day"
                value={prefs.weeklyDigestDay}
                onChange={(e) => set("weeklyDigestDay", e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="digest-time" className="block text-sm font-medium text-gray-700">
                Weekly digest time
              </label>
              <select
                id="digest-time"
                value={prefs.weeklyDigestTime}
                onChange={(e) => set("weeklyDigestTime", e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {TIMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testSending || !prefs.emailEnabled}
            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {testSending ? "Sending…" : testSent ? "Sent!" : "Send me a test digest"}
          </button>
        </div>
      </section>

      {/* Alert types */}
      <section className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${!emailEnabled || orgKilled ? disabledOpacity : ""}`}>
        <h2 className="text-lg font-medium text-gray-900">Alert types</h2>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600">Compliance alerts</h3>
          <div className="mt-2 space-y-2">
            {[
              { key: "complianceDropAlert" as const, label: `Compliance score drops by ${prefs.complianceDropThreshold}+ points` },
              { key: "newCriticalRiskAlert" as const, label: "New critical risk identified" },
              { key: "newUnownedHighRisk" as const, label: "New unowned high-risk AI system" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={prefs[key] as boolean}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600">Regulatory deadlines</h3>
          <div className="mt-2 space-y-2">
            {[
              { key: "regulatoryDeadline90" as const, label: "90 days before deadline" },
              { key: "regulatoryDeadline30" as const, label: "30 days before deadline" },
              { key: "regulatoryDeadline7" as const, label: "7 days before deadline" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={prefs[key] as boolean}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600">Operational alerts</h3>
          <div className="mt-2 space-y-2">
            {[
              { key: "vendorEvidenceExpiry" as const, label: `Vendor evidence expiring (${prefs.evidenceExpiryDays} days)` },
              { key: "shadowAiDetected" as const, label: "Shadow AI usage detected" },
              { key: "failedScanAlert" as const, label: "Failed security scan" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={prefs[key] as boolean}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Slack integration — admin only */}
      {isAdmin && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Slack integration</h2>
              <p className="mt-1 text-sm text-gray-500">
                Send critical and high severity alerts to a Slack channel via incoming webhook.
              </p>
            </div>
            <Toggle
              checked={slackEnabled}
              onChange={(v) => {
                setSlackEnabled(v);
                fetch("/api/v1/notifications/preferences", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slackEnabled: v }),
                });
              }}
              size="large"
              disabled={!prefs.org?.slackConfigured && !slackWebhookInput}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="slack-webhook" className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                id="slack-webhook"
                type="url"
                value={slackWebhookInput}
                onChange={(e) => setSlackWebhookInput(e.target.value.trim())}
                placeholder="https://hooks.slack.com/services/..."
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {prefs.org?.slackConfigured
                  ? "✓ A webhook is configured. Enter a new URL to replace it."
                  : "Status: Not configured"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveSlack}
                disabled={!slackWebhookInput || saving}
                className="flex-1 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {slackSaved ? "Saved!" : "Save webhook"}
              </button>
              <button
                type="button"
                onClick={handleTestSlack}
                disabled={(!slackWebhookInput && !prefs.org?.slackConfigured) || slackTestStatus === "sending"}
                className="flex-1 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {slackTestStatus === "sending" ? "Sending…"
                  : slackTestStatus === "success" ? "✓ Sent!"
                  : slackTestStatus === "error" ? "✗ Failed"
                  : "Send test message"}
              </button>
            </div>

            {slackTestStatus === "success" && (
              <p className="text-xs text-green-600">Test message sent. Check your Slack channel.</p>
            )}
            {slackTestStatus === "error" && (
              <p className="text-xs text-red-600">Failed to send. Check the webhook URL and try again.</p>
            )}
          </div>
        </section>
      )}

      {/* Non-admin Slack display */}
      {!isAdmin && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Slack integration</h2>
          <p className="mt-2 text-sm text-gray-500">
            {prefs.org?.slackEnabled
              ? "✓ Slack alerts are enabled for your organization. Critical and high alerts are sent to your team channel."
              : "Slack integration is managed by your organization administrator."}
          </p>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}

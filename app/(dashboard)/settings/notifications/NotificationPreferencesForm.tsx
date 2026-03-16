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
};

type NotificationPreferencesFormProps = {
  initialPrefs: NotificationPreference | null;
  userEmail: string | null;
};

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" }
];

const TIMES = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" }
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
  slackWebhookUrl: null
};

export function NotificationPreferencesForm({
  initialPrefs,
  userEmail
}: NotificationPreferencesFormProps) {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState<NotificationPreference>(
    initialPrefs ?? DEFAULT_PREFS
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribed = searchParams.get("unsubscribed") === "true";
  const resubscribed = searchParams.get("resubscribed") === "true";

  useEffect(() => {
    if (initialPrefs) setPrefs(initialPrefs);
  }, [initialPrefs]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs)
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
      const res = await fetch("/api/v1/notifications/send-test", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to send");
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch {
      setError("Failed to send test digest");
    } finally {
      setTestSending(false);
    }
  }, []);

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
        body: JSON.stringify({ emailEnabled: enabled })
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setPrefs((p) => ({ ...p, emailEnabled: !enabled })); // revert on error
    } finally {
      setSaving(false);
    }
  }, []);

  const emailEnabled = prefs.emailEnabled;
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

      {/* Master toggle - first and most prominent */}
      <div className="mb-6 rounded-lg border-2 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Email notifications</h2>
            <p className="mt-1 text-sm text-slate-500">
              {emailEnabled
                ? `You are receiving email notifications at ${userEmail ?? "your email"}`
                : "All email notifications are disabled. You will not receive any emails from AI Posture Platform."}
            </p>
          </div>
          <Toggle
            checked={emailEnabled}
            onChange={handleMasterToggle}
            size="large"
            disabled={saving}
          />
        </div>
        {!emailEnabled && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            ⓘ You can re-enable notifications at any time by toggling this back on.
          </div>
        )}
      </div>

      {/* Section 1: Email delivery */}
      <section
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${!emailEnabled ? disabledOpacity : ""}`}
      >
        <h2 className="text-lg font-medium text-gray-900">Email delivery</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <p className="mt-1 text-sm text-gray-500">{userEmail ?? "—"}</p>
          </div>
          <div className={`grid gap-4 sm:grid-cols-2 ${!emailEnabled ? "opacity-60" : ""}`}>
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
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
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
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testSending || !prefs.emailEnabled}
              className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {testSending ? "Sending…" : testSent ? "Sent!" : "Send me a test digest"}
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Alert types */}
      <section
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${!emailEnabled ? disabledOpacity : ""}`}
      >
        <h2 className="text-lg font-medium text-gray-900">Alert types</h2>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600">Compliance alerts</h3>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.complianceDropAlert}
                onChange={(e) => toggle("complianceDropAlert", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">
                Compliance score drops by {prefs.complianceDropThreshold}+ points
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.newCriticalRiskAlert}
                onChange={(e) => toggle("newCriticalRiskAlert", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">New critical risk identified</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.newUnownedHighRisk}
                onChange={(e) => toggle("newUnownedHighRisk", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">New unowned high-risk AI system</span>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600">Regulatory deadlines</h3>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.regulatoryDeadline90}
                onChange={(e) => toggle("regulatoryDeadline90", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">90 days before deadline</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.regulatoryDeadline30}
                onChange={(e) => toggle("regulatoryDeadline30", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">30 days before deadline</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.regulatoryDeadline7}
                onChange={(e) => toggle("regulatoryDeadline7", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">7 days before deadline</span>
            </label>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600">Operational alerts</h3>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.vendorEvidenceExpiry}
                onChange={(e) => toggle("vendorEvidenceExpiry", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">
                Vendor evidence expiring ({prefs.evidenceExpiryDays} days)
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.shadowAiDetected}
                onChange={(e) => toggle("shadowAiDetected", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">Shadow AI usage detected</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.failedScanAlert}
                onChange={(e) => toggle("failedScanAlert", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">Failed security scan</span>
            </label>
          </div>
        </div>
      </section>

      {/* Section 3: Slack (future) */}
      <section
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${!emailEnabled ? disabledOpacity : ""}`}
      >
        <h2 className="text-lg font-medium text-gray-900">Slack integration</h2>
        <p className="mt-2 text-sm text-gray-500">
          Slack notifications coming soon. For now, all alerts are delivered via email.
        </p>
        <div className="mt-4">
          <label htmlFor="slack-webhook" className="block text-sm font-medium text-gray-700">
            Webhook URL (optional)
          </label>
          <input
            id="slack-webhook"
            type="url"
            value={prefs.slackWebhookUrl ?? ""}
            onChange={(e) =>
              set("slackWebhookUrl", e.target.value.trim() || null)
            }
            placeholder="https://hooks.slack.com/services/..."
            className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <p className="mt-1 text-xs text-gray-500">Status: Not configured</p>
        </div>
      </section>

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

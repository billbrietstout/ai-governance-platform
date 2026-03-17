/**
 * components/notifications/NotificationPreferences.tsx
 * Full notification preferences UI — email toggles, alert types, Slack webhook
 */

'use client'

import { useState, useEffect } from 'react'

interface AlertPreferences {
  complianceScoreDrop: boolean
  newCriticalRisk: boolean
  newUnownedSystem: boolean
  deadline90Days: boolean
  deadline30Days: boolean
  deadline7Days: boolean
  vendorEvidenceExpiring: boolean
  shadowAiDetected: boolean
  failedSecurityScan: boolean
}

interface Preferences {
  emailEnabled: boolean
  alertPreferences: AlertPreferences
  org: {
    emailNotificationsEnabled: boolean
    slackEnabled: boolean
    slackConfigured: boolean
  }
}

const ALERT_LABELS: Record<keyof AlertPreferences, { label: string; group: string }> = {
  complianceScoreDrop:    { label: 'Compliance score drops by 10+ points', group: 'Compliance alerts' },
  newCriticalRisk:        { label: 'New critical risk identified',           group: 'Compliance alerts' },
  newUnownedSystem:       { label: 'New unowned high-risk AI system',        group: 'Compliance alerts' },
  deadline90Days:         { label: '90 days before deadline',                group: 'Regulatory deadlines' },
  deadline30Days:         { label: '30 days before deadline',                group: 'Regulatory deadlines' },
  deadline7Days:          { label: '7 days before deadline',                 group: 'Regulatory deadlines' },
  vendorEvidenceExpiring: { label: 'Vendor evidence expiring (30 days)',     group: 'Operational alerts' },
  shadowAiDetected:       { label: 'Shadow AI usage detected',               group: 'Operational alerts' },
  failedSecurityScan:     { label: 'Failed security scan',                   group: 'Operational alerts' },
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}

export default function NotificationPreferences({ isAdmin = false }: { isAdmin?: boolean }) {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [slackTestStatus, setSlackTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(data => { setPrefs(data); setLoading(false) })
  }, [])

  async function save(updates: Record<string, unknown>) {
    setSaving(true)
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testSlack() {
    setSlackTestStatus('sending')
    const res = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testSlack: true, slackWebhookUrl }),
    })
    const data = await res.json()
    setSlackTestStatus(data.success ? 'success' : 'error')
    setTimeout(() => setSlackTestStatus('idle'), 4000)
  }

  function updateAlertPref(key: keyof AlertPreferences, value: boolean) {
    if (!prefs) return
    const updated = { ...prefs.alertPreferences, [key]: value }
    setPrefs({ ...prefs, alertPreferences: updated })
    save({ alertPreferences: updated })
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  )

  if (!prefs) return null

  const orgKilled = !prefs.org.emailNotificationsEnabled
  const emailEffectivelyDisabled = orgKilled || !prefs.emailEnabled
  const groups = [...new Set(Object.values(ALERT_LABELS).map(v => v.group))]

  return (
    <div className="space-y-6">

      {/* Org-level kill switch — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Organization email notifications</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Master switch — disabling this stops all emails for every user in this organization.
              </p>
              {orgKilled && (
                <p className="text-amber-600 text-xs mt-1 font-medium">
                  ⚠️ All organization emails are currently disabled.
                </p>
              )}
            </div>
            <Toggle
              checked={prefs.org.emailNotificationsEnabled}
              onChange={v => {
                setPrefs({ ...prefs, org: { ...prefs.org, emailNotificationsEnabled: v } })
                save({ orgEmailEnabled: v })
              }}
            />
          </div>
        </div>
      )}

      {/* Per-user email toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Email notifications</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {emailEffectivelyDisabled
                ? orgKilled
                  ? 'All email notifications are disabled at the organization level.'
                  : 'All email notifications are disabled. You will not receive any emails from AI Readiness Platform.'
                : 'You will receive email notifications based on your preferences below.'}
            </p>
            {!orgKilled && !prefs.emailEnabled && (
              <p className="text-gray-400 text-xs mt-1">
                You can re-enable notifications at any time by toggling this back on.
              </p>
            )}
          </div>
          <Toggle
            checked={prefs.emailEnabled}
            disabled={orgKilled}
            onChange={v => {
              setPrefs({ ...prefs, emailEnabled: v })
              save({ emailEnabled: v })
            }}
          />
        </div>
      </div>

      {/* Alert type preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="font-semibold text-gray-900 text-sm mb-4">Alert types</p>
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{group}</p>
              <div className="space-y-3">
                {(Object.entries(ALERT_LABELS) as [keyof AlertPreferences, { label: string; group: string }][])
                  .filter(([, v]) => v.group === group)
                  .map(([key, { label }]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">{label}</label>
                      <input
                        type="checkbox"
                        checked={prefs.alertPreferences[key]}
                        disabled={emailEffectivelyDisabled}
                        onChange={e => updateAlertPref(key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slack integration — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Slack integration</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Send critical and high alerts to a Slack channel via webhook.
              </p>
            </div>
            <Toggle
              checked={prefs.org.slackEnabled}
              disabled={!prefs.org.slackConfigured && !slackWebhookUrl}
              onChange={v => {
                setPrefs({ ...prefs, org: { ...prefs.org, slackEnabled: v } })
                save({ slackEnabled: v })
              }}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={slackWebhookUrl}
                onChange={e => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {prefs.org.slackConfigured ? 'A webhook URL is already configured. Enter a new one to replace it.' : 'Create an incoming webhook in your Slack workspace settings.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => save({ slackWebhookUrl })}
                disabled={!slackWebhookUrl || saving}
                className="flex-1 py-2 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Save webhook
              </button>
              <button
                onClick={testSlack}
                disabled={(!slackWebhookUrl && !prefs.org.slackConfigured) || slackTestStatus === 'sending'}
                className="flex-1 py-2 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
              >
                {slackTestStatus === 'sending' ? 'Sending...'
                  : slackTestStatus === 'success' ? '✓ Sent!'
                  : slackTestStatus === 'error' ? '✗ Failed'
                  : 'Send test message'}
              </button>
            </div>

            {slackTestStatus === 'success' && (
              <p className="text-green-600 text-xs">Test message sent successfully. Check your Slack channel.</p>
            )}
            {slackTestStatus === 'error' && (
              <p className="text-red-600 text-xs">Failed to send. Check the webhook URL and try again.</p>
            )}
          </div>
        </div>
      )}

      {/* Save status */}
      {saved && (
        <p className="text-center text-green-600 text-sm font-medium">
          ✓ Preferences saved
        </p>
      )}
    </div>
  )
}

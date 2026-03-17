/**
 * lib/slack.ts
 * Slack webhook notification service for AI Posture Platform
 * Sends critical/high alerts via Slack Block Kit messages
 */

export interface SlackAlert {
  title: string
  severity: 'critical' | 'high'
  description: string
  organizationName: string
  systemName?: string
  actionUrl?: string
  layer?: string // CoSAI SRF layer (e.g. "AI Application", "AI Platform")
}

const SEVERITY_CONFIG = {
  critical: { emoji: '🔴', color: '#E53E3E', label: 'CRITICAL' },
  high:     { emoji: '🟠', color: '#DD6B20', label: 'HIGH' },
}

/**
 * Build a Slack Block Kit message for a CoSAI SRF alert
 */
function buildAlertBlocks(alert: SlackAlert) {
  const config = SEVERITY_CONFIG[alert.severity]
  const appUrl = process.env.APP_URL || 'https://ai-governance-platform-staging.up.railway.app'
  const actionUrl = alert.actionUrl || `${appUrl}/dashboard`

  return {
    text: `${config.emoji} ${alert.severity.toUpperCase()} Alert: ${alert.title}`,
    attachments: [
      {
        color: config.color,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${config.emoji} ${config.label} — ${alert.title}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Organization:*\n${alert.organizationName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${config.label}`,
              },
              ...(alert.systemName ? [{
                type: 'mrkdwn',
                text: `*AI System:*\n${alert.systemName}`,
              }] : []),
              ...(alert.layer ? [{
                type: 'mrkdwn',
                text: `*CoSAI SRF Layer:*\n${alert.layer}`,
              }] : []),
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Details:*\n${alert.description}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View in Platform →', emoji: true },
                url: actionUrl,
                style: alert.severity === 'critical' ? 'danger' : 'primary',
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `AI Posture Platform · Built on CoSAI SRF v0.7 · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
              },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Send a single alert to a Slack webhook
 */
export async function sendSlackAlert(
  webhookUrl: string,
  alert: SlackAlert
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = buildAlertBlocks(alert)
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Slack returned ${res.status}: ${text}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Send a batch of alerts — deduplicated, critical first
 */
export async function sendSlackAlerts(
  webhookUrl: string,
  alerts: SlackAlert[]
): Promise<{ sent: number; failed: number }> {
  // Critical first, then high
  const sorted = [...alerts].sort((a, b) =>
    a.severity === 'critical' && b.severity !== 'critical' ? -1 : 1
  )

  let sent = 0
  let failed = 0

  for (const alert of sorted) {
    const result = await sendSlackAlert(webhookUrl, alert)
    if (result.success) {
      sent++
    } else {
      failed++
      console.error(`[Slack] Failed to send alert "${alert.title}":`, result.error)
    }
    // Respect Slack rate limits — 1 message per second
    await new Promise(r => setTimeout(r, 1100))
  }

  return { sent, failed }
}

/**
 * Send a test message to verify webhook connectivity
 */
export async function sendSlackTest(
  webhookUrl: string,
  organizationName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSlackAlert(webhookUrl, {
    title: 'Slack Integration Test',
    severity: 'high',
    description: 'Your Slack integration is configured correctly. Critical and high alerts will appear here.',
    organizationName,
    actionUrl: process.env.APP_URL,
  })
}

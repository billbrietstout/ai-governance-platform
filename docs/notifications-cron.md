# Email Notification Cron Jobs

The AI Readiness Platform sends weekly digests and daily alerts via email. These are triggered by HTTP endpoints that must be called on a schedule.

## Required Environment Variables

Add to Railway (or your deployment) and `.env.local`:

- `RESEND_API_KEY` — Get from [resend.com](https://resend.com). Free tier: 3,000 emails/month, 100/day.
- `RESEND_FROM_EMAIL` — Sender address (e.g. `aireadiness@vstout.com`). Must be verified in Resend.
- `CRON_SECRET` — A secret string for authenticating cron requests. Generate with `openssl rand -base64 32`.

## Endpoints

Both endpoints require `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set.

### 1. Weekly digest

**POST** `/api/v1/notifications/send-digest`

Sends the AI Risk Briefing to all users with weekly digest enabled.

**Schedule:** Every Monday at 8:00 AM UTC (or your preferred timezone).

**Example (cron-job.org or similar):**

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_RAILWAY_DOMAIN/api/v1/notifications/send-digest
```

### 2. Daily alerts

**POST** `/api/v1/notifications/check-alerts`

Checks threshold alerts (e.g. unowned high-risk assets) and regulatory deadline reminders (90, 30, 7 days before EU AI Act).

**Schedule:** Every day at 7:00 AM UTC.

**Example:**

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_RAILWAY_DOMAIN/api/v1/notifications/check-alerts
```

## Setting Up cron-job.org (Free)

1. Sign up at [cron-job.org](https://cron-job.org).
2. Create a new cron job for the weekly digest:
   - URL: `https://YOUR_RAILWAY_DOMAIN/api/v1/notifications/send-digest`
   - Method: POST
   - Schedule: Every Monday at 8:00
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`
3. Create a second cron job for daily alerts:
   - URL: `https://YOUR_RAILWAY_DOMAIN/api/v1/notifications/check-alerts`
   - Method: POST
   - Schedule: Daily at 7:00
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

## Railway Note

Railway does not have built-in cron on the free tier. Use an external service like cron-job.org, EasyCron, or GitHub Actions scheduled workflows to call these endpoints.

# AI Readiness Platform — Dev Lead Deployment Checklist

**Built on CoSAI SRF v0.7 · Next.js 16 · Prisma · PostgreSQL · Railway · Auth0 · Resend**

---

## Pre-Deployment Checklist

### 1. Code & Build

- [ ] All feature branches merged to `develop`
- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run test` passes
- [ ] `npm run build` completes successfully
- [ ] No `console.log` or debug statements in production code
- [ ] All `.env.local` variables documented in this checklist

### 2. Database

- [ ] All Prisma migrations committed to `prisma/migrations/`
- [ ] `npx prisma migrate deploy` tested against staging DB
- [ ] No pending schema drift (`npx prisma migrate status`)
- [ ] Database backups verified in Railway dashboard
- [ ] Seed data reviewed — remove test orgs before production deploy

### 3. Branch Strategy

- [ ] `develop` → staging (auto-deploy via Railway)
- [ ] `main` → production (manual PR + approval required)
- [ ] Branch protection rules re-enabled on `main` after any emergency patches
- [ ] Workflow files (`weekly-digest.yml`, `daily-alerts.yml`) present on `main`

---

## Environment Variables

### Required — All Environments

| Variable              | Description                       | Where to get it                |
| --------------------- | --------------------------------- | ------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string      | Railway Postgres service       |
| `AUTH0_CLIENT_ID`     | Auth0 application client ID       | Auth0 dashboard                |
| `AUTH0_CLIENT_SECRET` | Auth0 application secret          | Auth0 dashboard                |
| `AUTH0_DOMAIN`        | Auth0 tenant domain               | Auth0 dashboard                |
| `AUTH0_ISSUER`        | `https://` + AUTH0_DOMAIN         | Derived                        |
| `NEXTAUTH_SECRET`     | Random 32-byte secret             | `openssl rand -base64 32`      |
| `NEXTAUTH_URL`        | Full app URL                      | e.g. `https://your-domain.com` |
| `RESEND_API_KEY`      | Resend email API key              | resend.com                     |
| `RESEND_FROM_EMAIL`   | Verified sender address           | Resend verified domain         |
| `CRON_SECRET`         | Authenticates cron endpoint calls | `openssl rand -base64 32`      |

### Required — Production Only

| Variable            | Description              | Notes                                |
| ------------------- | ------------------------ | ------------------------------------ |
| `RESEND_FROM_EMAIL` | Must use verified domain | Change from `onboarding@resend.dev`  |
| `APP_URL`           | Production URL           | Used in email links and Slack alerts |
| `NODE_ENV`          | Set to `production`      | Railway sets this automatically      |

### Optional

| Variable            | Description                                   |
| ------------------- | --------------------------------------------- |
| `SLACK_WEBHOOK_URL` | Org-level Slack alerts (stored in DB per org) |
| `CRON_SECRET`       | If not set, cron endpoints are unprotected    |

### Pre-Production Checklist

- [ ] `RESEND_FROM_EMAIL` changed from `onboarding@resend.dev` to verified domain
- [ ] Custom domain verified in Resend dashboard
- [ ] `APP_URL` set to production URL (affects email unsubscribe links)
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Auth0 callback URLs updated to production domain:
  - Allowed Callback URLs: `https://your-domain.com/api/auth/callback/auth0`
  - Allowed Logout URLs: `https://your-domain.com`
  - Allowed Web Origins: `https://your-domain.com`

---

## Railway Deployment

### Staging Deploy (develop branch)

```bash
git checkout develop
git pull origin develop
npm run build                          # verify clean build
git push origin develop                # triggers Railway auto-deploy
railway logs --tail 50                 # monitor for errors
```

### Production Deploy (main branch)

```bash
git checkout develop
git pull origin develop
git checkout -b patch/release-vX.X.X
# -- final testing on staging --
git checkout main
git pull origin main
git checkout -b release/vX.X.X
git merge develop
git push origin release/vX.X.X
# Open PR: release/vX.X.X → main
# Get approval → merge
# Railway auto-deploys main to production
```

### Post-Deploy Database Migration

```bash
# Always run migrations after deploy — use public Railway URL
DATABASE_URL="postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:PORT/railway" \
  npx prisma migrate deploy
```

### Verify Deploy

```bash
railway logs --tail 50                 # check for startup errors
curl https://your-domain.com/api/health  # health check endpoint
```

---

## GitHub Actions

### Workflows (must be on `main` branch to appear in Actions sidebar)

| Workflow            | Schedule            | Trigger                    |
| ------------------- | ------------------- | -------------------------- |
| `weekly-digest.yml` | Mondays 8:00 AM UTC | `workflow_dispatch` + cron |
| `daily-alerts.yml`  | Daily 7:00 AM UTC   | `workflow_dispatch` + cron |
| `ci.yml`            | Every push/PR       | Push + pull_request        |

### Required GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret           | Value                     |
| ---------------- | ------------------------- |
| `DATABASE_URL`   | Railway production DB URL |
| `RESEND_API_KEY` | Resend API key            |
| `APP_URL`        | Production app URL        |

### Adding workflow files to main

```bash
git checkout main
git pull origin main
git checkout -b patch/add-workflows
git checkout develop -- .github/workflows/weekly-digest.yml
git checkout develop -- .github/workflows/daily-alerts.yml
git commit -m "feat: add workflow files to main"
git push origin patch/add-workflows
# Open PR → merge
```

---

## Email Notifications

### Cron Setup (cron-job.org)

| Job           | URL                                       | Schedule       | Method |
| ------------- | ----------------------------------------- | -------------- | ------ |
| Weekly digest | `POST /api/v1/notifications/send-digest`  | Mon 8:00 UTC   | POST   |
| Daily alerts  | `POST /api/v1/notifications/check-alerts` | Daily 7:00 UTC | POST   |

Both require header: `Authorization: Bearer $CRON_SECRET`

### Email Checklist

- [ ] Resend domain verified (DNS records added)
- [ ] `RESEND_FROM_EMAIL` set to verified domain address
- [ ] Test digest sent via `/settings/notifications` → "Send me a test digest"
- [ ] Unsubscribe links tested — token-based, not email-based
- [ ] Resubscribe flow tested
- [ ] Weekly digest GitHub Action manual trigger tested

---

## Auth0 Configuration

### Application Settings

- Application Type: Regular Web Application
- Token Endpoint Auth Method: Post
- Allowed Callback URLs: `https://your-domain.com/api/auth/callback/auth0`
- Allowed Logout URLs: `https://your-domain.com`
- Allowed Web Origins: `https://your-domain.com`

### Session Configuration (lib/auth.ts)

- Session strategy: JWT
- Max age: 8 hours
- Update age: 30 minutes
- Session expiry warning: shown 5 minutes before expiry

### Auth Checklist

- [ ] Auth0 callback URLs updated for production domain
- [ ] MFA enabled for ADMIN and CAIO roles
- [ ] Account lockout tested (failed attempts → lockedUntil)
- [ ] Session expiry warning modal verified

---

## Slack Integration

### Per-Organization Setup

1. Create Slack app at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook to workspace → select channel
4. Copy webhook URL
5. Paste into `/settings/notifications` → Slack section
6. Click "Send test message" to verify
7. Enable Slack toggle

### Checklist

- [ ] Slack app created with "AI Readiness Platform" branding
- [ ] Webhook URL saved per org in database
- [ ] Test message verified before enabling
- [ ] Critical/high alerts confirmed routing to Slack

---

## Pre-Launch Checklist

### Security

- [ ] `NEXTAUTH_SECRET` is a fresh random value (not reused from staging)
- [ ] `CRON_SECRET` is set and endpoints are protected
- [ ] Branch protection re-enabled on `main`
- [ ] No hardcoded secrets in codebase (`grep -r "sk_live\|pk_live" --include="*.ts"`)
- [ ] Auth0 production tenant configured (separate from dev tenant)

### Data

- [ ] Demo/seed data removed from production DB
- [ ] Meridian Industrial Group demo org removed or marked internal
- [ ] Database backups scheduled in Railway

### Monitoring

- [ ] Railway health checks configured
- [ ] Error alerting set up (Railway → Observability)
- [ ] Cron jobs verified running on schedule (check cron-job.org logs)
- [ ] Weekly digest confirmed delivered to real inbox

### Domain & DNS

- [ ] Custom domain configured in Railway
- [ ] SSL certificate active
- [ ] Resend DNS records verified (SPF, DKIM, DMARC)
- [ ] `APP_URL` and `NEXTAUTH_URL` updated to custom domain

---

## Rollback Procedure

### Quick Rollback

```bash
# Railway dashboard → Deployments → click previous deployment → Redeploy
```

### Database Rollback

```bash
# Prisma does not auto-rollback — manually revert schema changes
DATABASE_URL="<public url>" npx prisma migrate resolve --rolled-back <migration_name>
```

### Emergency Contacts

| Role            | Contact                   |
| --------------- | ------------------------- |
| Platform Admin  | bill@vstout.com           |
| Railway Support | https://railway.app/help  |
| Auth0 Support   | https://support.auth0.com |
| Resend Support  | https://resend.com/help   |

---

## Known Issues & Technical Debt

| Issue                                                          | Priority | Notes                                |
| -------------------------------------------------------------- | -------- | ------------------------------------ |
| `/dashboard` slow initial load — many Prisma queries           | High     | Consider caching or skeleton loading |
| `ci.yml` CI checks failing on PRs                              | Medium   | Pre-existing lint/type errors        |
| Workflow files must be on `main` branch                        | Low      | Documented above                     |
| `next-env.d.ts` auto-generated file conflicts on branch switch | Low      | Run `git checkout -- next-env.d.ts`  |
| SMB usability issues in Regulation Discovery Wizard            | High     | See usability test findings          |

---

## Usability Issues Backlog (from Sarah persona test)

| #   | Issue                                                      | Location                 | Priority |
| --- | ---------------------------------------------------------- | ------------------------ | -------- |
| 1   | AI system type dropdown uses jargon (MODEL/AGENT/PIPELINE) | Regulation Wizard Step 1 | High     |
| 2   | "Operating model" uses IaaS/PaaS/SaaS terminology          | Regulation Wizard Step 2 | High     |
| 3   | "Autonomy level" opaque to non-technical users             | Regulation Wizard Step 2 | High     |
| 4   | "Expected risk level" asks users to self-assess            | Regulation Wizard Step 3 | Medium   |
| 5   | "Evidence requirements" is compliance jargon in CTA        | Regulation Wizard Step 4 | Medium   |
| 6   | Risk score 30/100 needs plain-language severity label      | Results page             | High     |
| 7   | "M3" maturity level needs inline context                   | Results page             | Medium   |
| 8   | Regulatory Overlap donut chart too technical               | Results page             | Medium   |
| 9   | "Layer 1/3" CoSAI references need tooltips                 | Results page             | Low      |

_Resume usability test: Sarah just signed up — next screen is post-registration onboarding._

---

_Last updated: March 17, 2026_
_Stack: Next.js 16.1.6 · Prisma 6.19.2 · PostgreSQL · Railway · Auth0 · Resend · CoSAI SRF v0.7_

## Local Dev Troubleshooting

- Auth0 hang / signout hang: run `rm -rf .next && npm run dev`
- Multiple dev servers: run `pkill -f 'next dev' && pkill -f 'next-server'`

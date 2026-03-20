# AI Readiness Platform — Claude Code Handoff Document
*Generated from active development session — March 19, 2026*

---

## Project Overview

**Product:** AI Readiness Platform
**Positioning:** SMB-focused AI governance and readiness assessment tool. Helps small-to-medium businesses understand what AI they're running, who's responsible for it, and whether they're ready for regulations and audits.
**Framework:** Built on the CoSAI AI Shared Responsibility Framework (SRF) v0.7 — a 5-layer enterprise architecture model (Business → Information → Application → Platform → Model Supply Chain).
**NOT competing with:** Enterprise AI governance platforms (IBM, ServiceNow, etc.)
**Target users:** SMB operations managers, IT managers, consultants serving SMB clients

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (Turbopack, App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Railway) + Prisma 6.19.2 |
| Auth | Auth0 via Auth.js v5 |
| API | tRPC |
| Email | Resend |
| Styling | Tailwind CSS v4 |
| Deployment | Railway (staging auto-deploy from `develop`) |
| Notifications | GitHub Actions (weekly-digest.yml, daily-alerts.yml) |
| Monitoring | Railway logs |

---

## Repository

- **Repo:** github.com/billbrietstout/ai-governance-platform
- **Active branch:** `develop` (auto-deploys to Railway staging)
- **Default branch:** `main` (requires PR + approval)
- **Staging URL:** https://ai-governance-platform-staging.up.railway.app

---

## Accounts

| Email | Org | Role | Notes |
|-------|-----|------|-------|
| bill@vstout.com | Stout Ventures | ENTERPRISE / platform admin | Primary admin |
| billbrietstout@yahoo.com | Stout AI Advisory | CONSULTANT | Consultant demo |
| Meridian Industrial Group | — | PRO | Seeded demo client org |

---

## Architecture — CoSAI 5-Layer Model

The platform maps all AI assets to one of 5 CoSAI SRF layers:

| Layer | Code | Focus |
|-------|------|-------|
| L1 | LAYER_1_BUSINESS | Governance, strategy, compliance (C-Suite) |
| L2 | LAYER_2_INFORMATION | Data management, quality, privacy (Data Owners) |
| L3 | LAYER_3_APPLICATION | Development, integration, testing (Dev Teams) |
| L4 | LAYER_4_PLATFORM | Infrastructure, APIs, tooling (Platform Providers) |
| L5 | LAYER_5_SUPPLY_CHAIN | Models, training, supply chain (Model Providers) |

---

## Key File Locations

```
app/
  (dashboard)/
    dashboard/
      page.tsx              # Main dashboard — persona fast-path + Suspense streaming
      ciso/page.tsx         # CISO persona dashboard
      loading.tsx           # Dashboard skeleton
    settings/notifications/ # Notification preferences UI
  (public)/
    discover/wizard/        # Regulation Discovery Wizard (pre-auth)
    unsubscribe/page.tsx    # Unsubscribe confirmation page

lib/
  compliance/
    engine.ts               # Core compliance scoring engine
    bulk-engine.ts          # NEW: Bulk compliance queries (replaces per-asset loops)
  dashboard/
    cached-queries.ts       # NEW: unstable_cache wrappers for dashboard data
  discovery/
    engine.ts               # Regulation discovery logic (EU AI Act jurisdiction logic)
    regulation-domains.ts   # Regulation definitions
  vertical-regulations.ts   # Per-vertical regulation mappings
  slack.ts                  # Slack Block Kit notification service
  email/
    templates/
      weekly-digest.ts      # Weekly digest email template
      threshold-alert.ts    # Alert email template

prisma/
  schema.prisma             # Full data model
  migrations/               # All migrations including recent notification/slack ones

scripts/jobs/
  weekly-digest.js          # GitHub Actions weekly digest job
  daily-alerts.js           # GitHub Actions daily alerts job

.github/workflows/
  weekly-digest.yml         # Runs Monday 8AM UTC
  daily-alerts.yml          # Runs daily 7AM UTC
  ci.yml                    # CI on every push (currently failing — pre-existing)

docs/
  DEPLOYMENT_CHECKLIST.md   # Full deployment runbook
  notifications-cron.md     # Cron setup documentation
```

---

## Completed Work (This Session)

### ✅ GitHub Actions Workflows
- `weekly-digest.yml` and `daily-alerts.yml` created and live
- Must exist on `main` branch to appear in GitHub Actions sidebar
- Tested via manual workflow_dispatch — email confirmed delivered

### ✅ Email Notification Enhancements
- Org-level kill switch (`Organization.notificationsEnabled`)
- Per-user email toggle (`NotificationPreference.emailEnabled`)
- Token-based unsubscribe (security fix — replaces email-based)
- Per-alert-type preferences (9 alert types)
- Unsubscribe page at `app/(public)/unsubscribe/page.tsx`
- Resubscribe via token at `app/api/v1/notifications/unsubscribe/route.ts`

### ✅ Slack Integration
- Webhook-based (Option A — not full OAuth)
- Slack app: "AI Readiness Platform" with incoming webhooks
- Block Kit messages with severity badges, org name, "View in Platform" button
- Critical/high alerts only
- Per-org webhook URL stored in `Organization.slackWebhookUrl`
- Test message button in `/settings/notifications`
- Admin-only configuration

### ✅ Rebrand
- "AI Posture Platform" → "AI Readiness Platform" across all 40 files
- Export filenames updated (ai-posture-* → ai-readiness-*)
- Footer in Slack messages still says "AI Posture Platform" — needs updating

### ✅ Session Expiry Warning Modal
- `components/auth/SessionExpiryWarning.tsx`
- Polls `/api/auth/session` every 30 seconds
- Shows warning 5 minutes before expiry
- "Stay signed in" extends session, "Sign out" redirects to login
- Added to `DashboardShell.tsx`
- Does NOT use `useSession` (incompatible with Auth.js v5) — uses fetch polling

### ✅ Dashboard Performance
- **Persona fast-path:** Only 1 DB query before redirect (was 12 queries)
- **Suspense streaming:** Page renders in ~200ms with skeletons, data streams in
- **unstable_cache:** 5-minute TTL on KPIs, layer posture, sankey, heatmap, risk matrix, maturity
- **Bulk compliance engine:** `lib/compliance/bulk-engine.ts` — 7 queries total vs 270+ sequential
- Cached query functions in `lib/dashboard/cached-queries.ts` use Prisma directly (not tRPC) to avoid `headers()` conflict with `unstable_cache`

### ✅ CISO Dashboard Bar Chart Fix
- Compliance bars now use `scoreColor()` with Tailwind classes
- Tailwind v4 safelist added to `app/globals.css` via `@source inline()`
- Bars correctly sized and colored (amber for 30-60%, red <30%, blue 60-80%, green >80%)

### ✅ Regulation Discovery Engine Fix
- EU AI Act no longer shows as MANDATORY for US-only deployments with no EU resident data
- Fixed: `GENERAL` vertical had `EU_AI_ACT` with `mandatory: true` — changed to `false`
- Fixed: Vertical regulations loop now checks `euJurisdiction && euPossible` before adding EU regs

### ✅ Dev Lead Deployment Checklist
- `docs/DEPLOYMENT_CHECKLIST.md` — comprehensive runbook
- Covers: env vars, Railway deploy, migrations, GitHub Actions, Auth0, Slack, pre-launch

---

## Current Issues & Known Bugs

| # | Issue | File | Priority |
|---|-------|------|----------|
| 1 | `ci.yml` CI checks failing on PRs | `.github/workflows/ci.yml` | Medium |
| 2 | Slack footer still says "AI Posture Platform" | `lib/slack.ts` line ~60 | Low |
| 3 | Dashboard slow queries remain in non-cached paths (persona dashboards) | Various | Medium |
| 4 | No super-admin interface for managing orgs/users | — | High |
| 5 | `next-env.d.ts` conflicts on branch switch | — | Low |

---

## Immediate Next Steps (Priority Order)

### 1. Super-Admin Interface (HIGH)
Need a super-admin panel to manage organizations without direct DB access.
Required features:
- List all organizations (name, plan, tier, user count, created date)
- View/edit org details (plan, tier, asset limit, users limit)
- List users in an org
- Delete a user or org (with cascade)
- Impersonate an org (set workspace cookie)
- View audit logs per org

Suggested route: `app/(dashboard)/settings/admin/` (may already partially exist — check)

### 2. Stripe Integration (HIGH)
- Pricing page exists at `/pricing`
- `BillingContent.tsx` exists at `app/(dashboard)/settings/billing/`
- Plans: FREE, PRO ($49/mo), ENTERPRISE ($199/mo), CONSULTANT ($149/mo)
- Need: Stripe checkout, webhook handler, plan enforcement
- DB fields already exist: `Organization.plan`, `Organization.tier`, `Organization.trialStartedAt`, `Organization.trialEndsAt`

### 3. Usability Fixes from Sarah Persona Test (HIGH)
See full list below.

### 4. Resume Sarah Usability Test
Sarah just signed up after the Regulation Discovery Wizard. Next screen to test: post-registration onboarding flow.

---

## Usability Issues Backlog (Sarah Persona Test)

Sarah Chen — SMB Operations Manager, non-technical, uses ChatGPT + Copilot, auditor asked about AI governance.

| # | Issue | Location | Priority | Recommended Fix |
|---|-------|----------|----------|-----------------|
| 1 | AI system type dropdown uses jargon (MODEL/AGENT/APPLICATION/PIPELINE) | Regulation Wizard Step 1 | High | Add plain-language descriptions: "AI-Powered App (e.g. ChatGPT, Grammarly)" |
| 2 | "Operating model" uses IaaS/PaaS/SaaS terminology | Regulation Wizard Step 2 | High | Rephrase as "How do you access this AI?" with plain options |
| 3 | "Autonomy level" opaque to non-technical users | Regulation Wizard Step 2 | High | Rephrase as "How independently does this AI act?" with examples |
| 4 | "Expected risk level" asks users to self-assess | Regulation Wizard Step 3 | Medium | Remove field — derive from other answers |
| 5 | "Evidence requirements" jargon in CTA | Regulation Wizard Step 4 | Medium | Change to "step-by-step action plan" |
| 6 | Risk score 30/100 needs plain-language label | Results page | High | Add color + label: "Low Risk / Medium Risk / High Risk" |
| 7 | "M3" maturity level needs inline context | Results page | Medium | Show as "Level 3 of 5 — Intermediate" |
| 8 | Regulatory Overlap donut chart too technical | Results page | Medium | Replace with plain-language summary paragraph |
| 9 | "Layer 1/3" CoSAI references confusing | Results page | Low | Add tooltip: "Business governance layer" etc. |

*Test paused: Sarah just signed up. Resume from post-registration onboarding screen.*

---

## Environment Variables

### Local (`.env.local`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_governance
AUTH0_CLIENT_ID=I1bZJkMKhoIzH06jELtauMvQ8Ms80vqB
AUTH0_DOMAIN=dev-04ybmdim8q7txppk.us.auth0.com
AUTH0_ISSUER=https://dev-04ybmdim8q7txppk.us.auth0.com
AUTH0_BASE_URL=http://localhost:3000
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Railway Staging
- `DATABASE_URL` — internal Railway Postgres URL
- Public URL for migrations: `postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:50847/railway`
- All other vars set in Railway Variables tab

### Pre-Production Changes Needed
- `RESEND_FROM_EMAIL` → verified custom domain (not `onboarding@resend.dev`)
- `APP_URL` → production URL
- `NEXTAUTH_URL` → production URL
- Auth0 callback URLs → production domain

---

## Local Development

```bash
# Start local Postgres
docker start ai-governance-db  # or docker-compose up

# Clear cache if Auth hangs
rm -rf .next && npm run dev

# Kill stale dev servers
pkill -f "next dev" && pkill -f "next-server"

# Run migrations locally
npx prisma migrate dev --name <name>

# Run migrations on Railway staging
DATABASE_URL="postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:50847/railway" npx prisma migrate deploy
```

---

## Branch Protection Notes
- `main` requires PR approval + CI checks to pass
- CI checks currently failing (pre-existing lint/type errors)
- Workaround: temporarily disable branch protection in Settings → Branches → Edit
- Always re-enable after emergency patches
- Workflow files must be on `main` to appear in GitHub Actions sidebar

---

## CoSAI SRF Reference
The platform is built on the CoSAI AI Shared Responsibility Framework Draft V0.7 (OASIS Open Project).
Key concepts used throughout:
- 5 enterprise architecture layers (see above)
- 8 personas: Agentic Platform Provider, Application Developer, Data Provider, AI System Users, AI System Governance, Model Provider, AI Model Serving, AI Platform Provider
- Operating models: IaaS, AI-PaaS, Agent-PaaS, AI-SaaS
- Autonomy levels: L0 (no automation) → L5 (full autonomy)
- Human intervention tiers: T1 (soft guidance) → T5 (emergency shutdown)
- RACI principle: exactly one accountable party per component

---

*Handoff generated: March 19, 2026*
*Session length: ~8 hours of active development*
*Commits this session: ~35*

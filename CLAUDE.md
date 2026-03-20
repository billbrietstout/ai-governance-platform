# AI Governance Platform

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — ESLint (next/core-web-vitals)
- `npm run type-check` — TypeScript check (`tsc --noEmit`)
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright end-to-end tests
- `npm run format:check` — Prettier check
- `npx prisma migrate dev` — Run Prisma migrations
- `npx prisma generate` — Regenerate Prisma client

## Code Style

- Prettier: double quotes, no trailing commas, 100 char width
- ESLint: next/core-web-vitals
- Import alias: `@/*` maps to project root

## Architecture

- **Framework**: Next.js 15 App Router
- **API**: tRPC + REST hybrid
- **Auth**: Auth0 via NextAuth v4 with JWT strategy
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS v4
- **Tenant isolation**: AsyncLocalStorage via `lib/tenant.ts`; queries auto-filter by org when `setTenantContext()` is called

## File Naming

- PascalCase for React components (`DashboardShell.tsx`)
- camelCase for lib/utility modules (`auth.ts`, `tenant.ts`)
- kebab-case for route directories (`super-admin`, `layer3-application`)

## Security Checklist

- Validate all user input at system boundaries (Zod)
- Never trust client-side auth state — always re-check `auth()` in Server Actions/API routes
- Tenant isolation: always call `setTenantContext(orgId)` before tenant-scoped queries
- Super admin queries intentionally bypass tenant isolation (no `setTenantContext` call)
- Protect against OWASP top 10 (XSS, injection, CSRF, etc.)

# AGENTS.md — Project Context

## Project
AgriPride AI — Next.js agri-tech app with Paystack payments, Supabase (configured but tables missing/RLS-blocked), and in-memory demo store fallback.

## Critical Runtime Behavior
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel env → `isSupabaseConfigured = true`
- Supabase tables (`subscription_plans`, `paystack_transactions`) likely **do not exist** or have RLS blocking
- All `BaseService` methods try Supabase first, then **fall through** to `serverStore` (in-memory Map)

## Key Architecture
- `src/services/base.service.ts` — Abstract CRUD base with Supabase → demo store fallthrough for every method
- `src/services/subscription.service.ts` — `getByTier()`, `getUserSubscription()` also fall back
- `src/lib/paystack.ts` — `PaystackTransactionService` queries fall back on error
- `demoStore` (from `src/lib/demo-store.ts`) — in-memory store seeded with plans, transactions, users

## Payment Flow
1. User clicks "Pay with Paystack" → `/api/payments` or `/api/subscribe`
2. Backend calls `subscriptionService.getByTier()` to get plan price
3. Creates Paystack transaction → returns `authorization_url`
4. User completes payment on Paystack → redirected to `/api/payments/callback`
5. Callback verifies via `PaystackTransactionService.getByReference()` and `paystack.transaction.verify()`
6. Webhook at `/api/webhooks/paystack` handles async confirmation

## Fix History
- `getAll()` (create): falls through when Supabase returns empty (not just errors)
- All writes (`create`, `update`, `delete`): mirror to demo store even when Supabase succeeds
- Frontend `/pricing`: fixed response data unwrapping (`data.authorization_url` → `data.data?.authorization_url || data.authorization_url`)
- All `BaseService` reads: fall through to demo store when Supabase errors or returns empty

## Common Errors Fixed
- `error.message` on null `error` in `create()` fallthrough — use `error?.message || 'Unknown error'`
- Admin pages (contacts, tickets, testimonials, subscriptions) hang on loading because `.then()` had no `.catch()` — added toast error + `setLoading(false)` in catch
- `SidebarContext` lifted collapsed state out of Sidebar so `DashboardLayout` can apply dynamic `lg:ml-64` / `lg:ml-16` margin — prevents 192px wasted space on desktop when sidebar is collapsed

## Dashboard Layout
- `src/lib/sidebar-context.tsx` — `SidebarProvider` + `useSidebar()` hook, consumed by both `Sidebar.tsx` (toggle) and `DashboardLayout` (dynamic margin)
- `DashboardLayout` wraps children in `SidebarProvider` and applies `overflow-x-auto` to prevent horizontal overflow
- Farmer weather forecast uses `overflow-x-auto` with `min-w-[280px]` on the 7-day grid to prevent overflow on narrow cards

## Responsiveness
- All `<TabsList>` across dashboard pages use `flex-wrap h-auto` to prevent tab overflow on narrow screens (admin/consent, admin/analytics, officer/disease)
- Contact messages and ticket descriptions capped with `line-clamp-3` to prevent card expansion
- Disease prediction table cells use `max-w-[200px] truncate` to prevent table stretching on narrow desktop

## Security (XSS)
- `src/middleware/security.ts` — `sanitizeInput()` uses `sanitize-html` (strip all tags). Also exports `sanitizeObject()`, `validateEmailHref()`, `validateTelHref()`.
- All user-text API routes sanitize before storage: `/api/testimonials`, `/api/contact`, `/api/ai/chat`, `/api/ai/diagnose`, `/api/payments`, `/api/subscribe`.
- Admin contacts page uses `validateEmailHref()`/`validateTelHref()` for `mailto:`/`tel:` hrefs to prevent `javascript:` protocol injection.
- CSP in `src/proxy.ts`: removes `'unsafe-eval'` in production; kept in dev for HMR.

## Contact Email Notifications
- `src/lib/email.ts` — uses Resend to forward contact form submissions to `NEXT_PUBLIC_CONTACT_EMAIL`.
- Env vars: `RESEND_API_KEY` (required), `RESEND_FROM` (defaults to `onboarding@resend.dev`).
- Fire-and-forget: if `RESEND_API_KEY` is not set, email sending is silently skipped.
- Vercel env `RESEND_FROM` set to `onboarding@resend.dev` (works without domain verification on Resend free tier).

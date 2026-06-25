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

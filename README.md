# GlobeBid

Production-ready MVP for a live 3D advertising marketplace: select a country, upload a brand, pay through Dodo Payments, and publish ownership only from a signed webhook.

## Run locally

1. Copy `.env.example` to `.env.local` and fill in Supabase and Dodo test credentials.
2. Apply `supabase/migrations/202608290001_initial.sql` in Supabase.
3. Run `pnpm seed`, then `pnpm dev`.
4. In Dodo, create a one-time **pay what you want** USD product and set `DODO_PRODUCT_ID`. Point the webhook at `/api/webhooks/dodo` and subscribe to payment, refund, and dispute lifecycle events.

Use `pnpm build` before deploying to Vercel. The UI remains explorable without credentials; upload/checkout correctly report missing server configuration.

## PostHog analytics

Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in Vercel. Analytics gracefully stays disabled without a key. Development capture is disabled by default; set `NEXT_PUBLIC_POSTHOG_DEBUG=true` temporarily to send local events and print SDK diagnostics.

The client initializes once in `src/instrumentation-client.ts`. Session Replay is enabled with all inputs masked, client events go through `src/lib/analytics/posthog-client.ts`, and verified payment/ownership events go through the non-blocking server helper. Apply the analytics Supabase migration before enabling production checkout so anonymous PostHog IDs can be stored on bids.

Use PostHog Live Events to confirm capture and Session Replay to verify input masking. The exact funnels, charts, retention reports, metrics, and duplicate-webhook QA procedure are documented in `docs/analytics.md`.

## Security model

The browser has read-only RLS access. Logo uploads, brands, pending bids, checkout sessions, webhook verification, cumulative stake updates, and ownership changes run server-side. `process_paid_bid` holds row locks and deduplicates by Dodo webhook ID, so payment races cannot overwrite a higher leader.

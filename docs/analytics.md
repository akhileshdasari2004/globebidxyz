# PostHog analytics

## Event contract

Client intent events use lowercase snake_case and contain no email, uploaded file contents, or payment details. Verified business events are emitted by the server only after the Dodo signature and atomic database operation succeed. `analytics_distinct_id` is correlation metadata on `bids`; it is never used for authorization.

Session Replay masks every input by default and additionally marks brand fields with `data-ph-mask`. Dodo payment fields are hosted outside this application and are never recorded.

Start with a 25% replay sample in PostHog project settings, plus event-triggered recording for `claim_opened`, `checkout_clicked`, and client exceptions. Increase sampling temporarily while investigating launch UX, then reduce it as traffic grows.

## Launch insights

Create these PostHog funnels using unique users and a 7-day conversion window unless noted otherwise:

1. **Core purchase:** `$pageview` → `globe_interacted` → `country_selected` → `claim_opened` → `checkout_clicked` → `checkout_created` → `payment_succeeded` → `bid_applied`.
2. **Country selection:** `country_selected` → `claim_opened` → `checkout_clicked`.
3. **Checkout:** `checkout_clicked` → `checkout_created` → `payment_succeeded`.
4. **Ownership:** `payment_succeeded` → `bid_applied` → one of `country_claimed`, `country_taken_over`, or `country_reclaimed`.

Break funnels down by initial UTM source, device type, and `country_code`. Keep PostHog's first-touch and session attribution properties rather than creating custom copies.

The homepage FAQ (`/`) and the full FAQ page (`/faq`) share one event contract: `faq_opened` on every expand, `view_all_faq_clicked` when a visitor leaves the homepage for `/faq`, and `faq_search_used` (fired once per session, `query_length` only — never the raw query) on `/faq`.

## Trend charts

- `country_selected` and `claim_opened`, broken down by `country_code`.
- Sum `amount` on `payment_succeeded` for verified revenue.
- `country_taken_over` and `country_reclaimed` over time.
- Counts of `paid_but_not_leader` and `external_brand_visit`.
- `faq_opened` broken down by `source` (`homepage` or `faq_page`) to see which questions get read where.
- Error tracking filtered to checkout, upload, country loading, and globe rendering paths.

## Retention

- Users who perform `country_selected` and return after 1, 7, and 30 days.
- Buyer retention: distinct IDs with `payment_succeeded` that later perform another `payment_succeeded`.

## Product metrics

| Metric | Definition |
| --- | --- |
| Visitor → globe interaction | Unique `globe_interacted` / unique visitors |
| Country interest | Unique `country_selected` / unique visitors |
| Claim intent | `claim_opened` / `country_selected` |
| Checkout intent | `checkout_clicked` / `claim_opened` |
| Checkout creation | `checkout_created` / `checkout_clicked` |
| Payment conversion | `payment_succeeded` / `checkout_created` |
| Ownership conversion | Leader-changing events / `payment_succeeded` |
| Repeat bidder rate | Buyers with more than one `payment_succeeded` / all buyers |
| Reclaim rate | `country_reclaimed` / brands previously outbid |
| Advertiser CTR | `external_brand_visit` / `country_selected` |

## QA

Set `NEXT_PUBLIC_POSTHOG_DEBUG=true` locally and use PostHog Live Events. Confirm one `$pageview`, one `globe_interacted` per browser session, matching distinct IDs on `checkout_clicked` and `checkout_created`, and a single server event chain after replaying the same Dodo webhook twice. Inspect a replay to confirm all claim inputs are masked. Reset the flag to `false` after testing.

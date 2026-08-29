import "server-only";
import { PostHog } from "posthog-node";
import type { ServerEventMap } from "./events";

async function capture<K extends keyof ServerEventMap>(distinctId: string | null | undefined, event: K, properties: ServerEventMap[K]) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY; if (!key || !distinctId) return;
  const client = new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com", flushAt: 1, flushInterval: 0 });
  try { client.capture({ distinctId, event, properties }); await client.shutdown(); } catch (error) { console.error("Non-blocking server analytics failure", event, error); try { await client.shutdown(); } catch {} }
}

export const serverAnalytics = {
  capture,
  checkoutCreated: (id: string | null, p: ServerEventMap["checkout_created"]) => capture(id, "checkout_created", p),
  paymentSucceeded: (id: string | null, p: ServerEventMap["payment_succeeded"]) => capture(id, "payment_succeeded", p),
  bidApplied: (id: string | null, p: ServerEventMap["bid_applied"]) => capture(id, "bid_applied", p),
  countryClaimed: (id: string | null, p: ServerEventMap["country_claimed"]) => capture(id, "country_claimed", p),
  countryTakenOver: (id: string | null, p: ServerEventMap["country_taken_over"]) => capture(id, "country_taken_over", p),
  countryReclaimed: (id: string | null, p: ServerEventMap["country_reclaimed"]) => capture(id, "country_reclaimed", p),
  paidButNotLeader: (id: string | null, p: ServerEventMap["paid_but_not_leader"]) => capture(id, "paid_but_not_leader", p),
  paymentFailed: (id: string | null, p: ServerEventMap["payment_failed"]) => capture(id, "payment_failed", p),
};

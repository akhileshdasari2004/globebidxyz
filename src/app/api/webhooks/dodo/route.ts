import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { getAdminClient } from "@/lib/supabase";
import { serverAnalytics } from "@/lib/analytics/posthog-server";

type AppliedBid = { processed: boolean; outcome?: string; country_code?: string; amount_added?: number; brand_total_stake?: number; country_leading_stake?: number; previous_leading_stake?: number; became_leader?: boolean; analytics_distinct_id?: string | null };

export async function POST(request: Request) {
  const raw = await request.text(); const webhookId = request.headers.get("webhook-id") || "";
  try {
    if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) throw new Error("Webhook key missing");
    const client = new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY || "unused", webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY, environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode" });
    type DodoPayload = { type: string; data?: { payment_id?: string; id?: string; metadata?: { bid_id?: string } } };
    const payload = client.webhooks.unwrap(raw, { headers: { "webhook-id": webhookId, "webhook-signature": request.headers.get("webhook-signature") || "", "webhook-timestamp": request.headers.get("webhook-timestamp") || "" } }) as unknown as DodoPayload;
    const type = payload.type as string; const data = payload.data || {}; const paymentId = data.payment_id || data.id || null; const bidId = data.metadata?.bid_id;
    const supabase = getAdminClient();
    if (type === "payment.succeeded" && bidId) {
      const { data: applied, error } = await supabase.rpc("process_paid_bid", { p_webhook_id: webhookId, p_event_type: type, p_payment_id: paymentId, p_bid_id: bidId, p_payload: JSON.parse(raw) }); if (error) throw error;
      const result = applied as AppliedBid | null; if (result?.processed) await emitPaidEvents(result, bidId, paymentId);
    } else {
      const inserted = await supabase.from("payment_webhooks").insert({ webhook_id: webhookId, event_type: type, payment_id: paymentId, payload: JSON.parse(raw), processed_at: new Date().toISOString() });
      const statuses: Record<string, string> = { "payment.failed": "failed", "payment.processing": "processing", "payment.cancelled": "cancelled", "refund.succeeded": "refunded", "dispute.opened": "disputed" };
      if (bidId && statuses[type]) { await supabase.from("bids").update({ status: statuses[type], dodo_payment_id: paymentId }).eq("id", bidId).neq("status", "paid"); if (type === "payment.failed" && !inserted.error) { const { data: bid } = await supabase.from("bids").select("analytics_distinct_id,country:countries(iso3)").eq("id", bidId).maybeSingle(); const country = Array.isArray(bid?.country) ? bid.country[0] : bid?.country; await serverAnalytics.paymentFailed(bid?.analytics_distinct_id || null, { country_code: country?.iso3 || "unknown", bid_id: bidId, failure_category: "provider_failed" }); } }
    }
    return NextResponse.json({ received: true });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Invalid or unprocessed webhook" }, { status: 401 }); }
}

async function emitPaidEvents(result: AppliedBid, bidId: string, paymentId: string | null) {
  const id = result.analytics_distinct_id || null; const country = result.country_code!; const amount = Number(result.amount_added || 0); const brandTotal = Number(result.brand_total_stake || 0); const leading = Number(result.country_leading_stake || 0); const previous = Number(result.previous_leading_stake || 0);
  await serverAnalytics.paymentSucceeded(id, { country_code: country, bid_id: bidId, payment_id: paymentId, amount });
  await serverAnalytics.bidApplied(id, { country_code: country, bid_id: bidId, amount_added: amount, brand_total_stake: brandTotal, country_leading_stake: leading });
  if (result.outcome === "country_claimed") await serverAnalytics.countryClaimed(id, { country_code: country, brand_total_stake: brandTotal });
  else if (result.outcome === "country_taken_over") await serverAnalytics.countryTakenOver(id, { country_code: country, previous_leading_stake: previous, new_leading_stake: leading });
  else if (result.outcome === "country_reclaimed") await serverAnalytics.countryReclaimed(id, { country_code: country, amount_added: amount, new_total_stake: brandTotal });
  else if (result.outcome === "paid_but_not_leader") await serverAnalytics.paidButNotLeader(id, { country_code: country, brand_total_stake: brandTotal, leading_stake: leading, gap_to_leader: Math.max(0, leading - brandTotal) });
}

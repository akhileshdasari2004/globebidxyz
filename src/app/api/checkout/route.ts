import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { checkoutSchema, normalizeWebsite } from "@/lib/validation";
import { getMinimumAddition } from "@/lib/pricing";
import { getAdminClient } from "@/lib/supabase";
import { serverAnalytics } from "@/lib/analytics/posthog-server";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json()); const websiteUrl = normalizeWebsite(input.brand.websiteUrl); const supabase = getAdminClient();
    const { data: country, error } = await supabase.from("countries").select("id,iso3,name,current_stake").eq("iso3", input.country).single(); if (error || !country) return NextResponse.json({ error: "Country not found" }, { status: 404 });
    // Look up the bidding brand's existing stake BEFORE computing the minimum, so a brand topping
    // up or reclaiming only has to add what's actually missing — never re-validated against the
    // client's claim, only against what the server itself just read.
    let { data: brand } = await supabase.from("brands").select("id").eq("website_url", websiteUrl).eq("status", "active").maybeSingle();
    let previous = 0;
    if (brand) { const { data: stake } = await supabase.from("country_stakes").select("total_amount").eq("country_id", country.id).eq("brand_id", brand.id).maybeSingle(); previous = Number(stake?.total_amount || 0); }
    const minimum = getMinimumAddition(Number(country.current_stake), previous); if (input.amount < minimum) return NextResponse.json({ error: `The minimum bid is now $${minimum}. Refresh and try again.` }, { status: 409 });
    if (!brand) { const created = await supabase.from("brands").insert({ name: input.brand.name, website_url: websiteUrl, logo_url: input.brand.logoUrl, status: "active" }).select("id").single(); if (created.error) throw created.error; brand = created.data; }
    const bidInsert = await supabase.from("bids").insert({ country_id: country.id, brand_id: brand.id, amount_added: input.amount, previous_total: previous, new_total: previous + input.amount, status: "pending", analytics_distinct_id: input.analyticsDistinctId || null }).select("id").single(); if (bidInsert.error) throw bidInsert.error;
    if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PRODUCT_ID) throw new Error("Dodo Payments environment is not configured");
    const client = new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY, environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode" });
    const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const attribution = new URLSearchParams(); for (const [key, value] of Object.entries(input.attribution || {})) if (value) attribution.set(key, value); const suffix = attribution.toString() ? `&${attribution}` : "";
    const session = await client.checkoutSessions.create({ product_cart: [{ product_id: process.env.DODO_PRODUCT_ID, quantity: 1, amount: Math.round(input.amount * 100) }], return_url: `${site}/?country=${country.iso3}&checkout=returned&bid_id=${bidInsert.data.id}${suffix}`, cancel_url: `${site}/?country=${country.iso3}${suffix}`, metadata: { bid_id: bidInsert.data.id, country_id: country.id, country_code: country.iso3, brand_id: brand.id, expected_amount: String(input.amount), currency: "USD", checkout_version: "1" }, customization: { theme: "dark", theme_config: { pay_button_text: `Claim ${country.name}` } }, feature_flags: { redirect_immediately: true } });
    await supabase.from("bids").update({ dodo_checkout_id: session.session_id }).eq("id", bidInsert.data.id);
    if (!session.checkout_url) throw new Error("Dodo did not return a checkout URL");
    await serverAnalytics.checkoutCreated(input.analyticsDistinctId || null, { country_code: country.iso3, bid_id: bidInsert.data.id, amount: input.amount, was_claimed: Number(country.current_stake) > 0, previous_country_stake: Number(country.current_stake) });
    return NextResponse.json({ checkoutUrl: session.checkout_url, bidId: bidInsert.data.id });
  } catch (error: unknown) { const details = error as { issues?: Array<{ message?: string }>; message?: string }; const message = details.issues?.[0]?.message || details.message || "Checkout could not start"; return NextResponse.json({ error: message }, { status: 400 }); }
}

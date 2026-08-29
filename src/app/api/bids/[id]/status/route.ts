import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  const { id } = await params; const supabase = getAdminClient();
  const { data, error } = await supabase.from("bids").select("id,status,amount_added,brand_id,country:countries(iso3,current_brand_id)").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  const country = Array.isArray(data.country) ? data.country[0] : data.country;
  return NextResponse.json({ status: data.status, country_code: country?.iso3, amount: Number(data.amount_added), became_leader: data.status === "paid" && country?.current_brand_id === data.brand_id }, { headers: { "cache-control": "no-store" } });
}

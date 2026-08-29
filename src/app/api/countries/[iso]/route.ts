import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ iso: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ bidders: [] });
  const { iso } = await params; const supabase = getAdminClient();
  const { data: country } = await supabase.from("countries").select("id").eq("iso3", iso.toUpperCase()).maybeSingle();
  if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });
  const { data, error } = await supabase.from("country_stakes").select("brand_id,total_amount,brand:brands(name,logo_url,website_url)").eq("country_id", country.id).order("total_amount", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: "Bidder data unavailable" }, { status: 500 });
  return NextResponse.json({ bidders: (data || []).map((row) => ({ ...row, total_amount: Number(row.total_amount), brand: Array.isArray(row.brand) ? row.brand[0] || null : row.brand })) }, { headers: { "cache-control": "no-store" } });
}

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({});
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("countries").select("id,iso2,iso3,name,centroid_lat,centroid_lng,current_stake,brand:brands!countries_current_brand_id_fkey(id,name,website_url,tagline,logo_url)");
  if (error) return NextResponse.json({ error: "Globe data unavailable" }, { status: 500 });
  type GlobeRow = { iso3: string; centroid_lat: string | number; centroid_lng: string | number; current_stake: string | number; brand: unknown } & Record<string, unknown>;
  return NextResponse.json(Object.fromEntries(((data || []) as GlobeRow[]).map((row) => [row.iso3, { ...row, centroid_lat: Number(row.centroid_lat), centroid_lng: Number(row.centroid_lng), current_stake: Number(row.current_stake), brand: Array.isArray(row.brand) ? row.brand[0] || null : row.brand }])), { headers: { "cache-control": "public, s-maxage=10, stale-while-revalidate=60" } });
}

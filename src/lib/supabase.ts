import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export function getAdminClient() { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) throw new Error("Supabase server environment is not configured"); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
// A fresh createClient() per call spins up its own auth listener and realtime socket — called from
// an effect that re-runs on every country selection, that meant a new client (and a new open
// websocket) on every click, on top of triggering Supabase's own "Multiple GoTrueClient instances"
// warning. One client for the lifetime of the tab, shared by every caller.
let browserClient: SupabaseClient | null | undefined;
export function getBrowserClient() {
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  browserClient = url && key ? createClient(url, key) : null;
  return browserClient;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. These are never NEXT_PUBLIC_ — the service role key must not be
// bundled into client JavaScript, so every read and write goes through an API
// route rather than the browser.

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// A missing table (42P01) or a stale schema cache must never surface as a crash
// — the demo has to work before anyone runs the SQL.
export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || /schema cache|does not exist/i.test(error.message ?? "");
}

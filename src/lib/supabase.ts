import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only. These are never NEXT_PUBLIC_ — the service role key must not be
// bundled into client JavaScript, so every read and write goes through an API
// route rather than the browser.

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  // createClient throws synchronously on a malformed URL (a pasted Postgres
  // connection string, a stray newline). Persistence is a nicety here, so a
  // bad value must degrade to in-memory rather than take down a pipeline run.
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
    return client;
  } catch (err) {
    console.error("supabase client init failed", err instanceof Error ? err.message : err);
    return null;
  }
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

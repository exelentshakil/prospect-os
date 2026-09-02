import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai";
import { crm } from "@/lib/engine/crm";
import { ENGINE_VERSION } from "@/lib/engine/types";
import { UNIVERSE } from "@/lib/engine/universe";
import { RUBRIC_VERSION } from "@/lib/engine/scoring";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Probe rather than assume: "configured" only means an env var is present, and
// a demo that reports a layer live when it is broken is worse than no report.
async function probeSupabase(): Promise<{ live: boolean; note: string }> {
  if (!supabaseConfigured()) {
    return { live: false, note: "in-memory (demo runs without credentials)" };
  }
  try {
    const db = supabase();
    if (!db) return { live: false, note: "credentials present but client init failed — check SUPABASE_URL format" };
    const { error } = await db.from("crm_records").select("domain").limit(1);
    if (!error) return { live: true, note: "supabase reachable, tables present" };
    if (error.code === "42P01" || /schema cache|does not exist/i.test(error.message)) {
      return { live: true, note: "supabase reachable, tables missing — run supabase_traffic.sql" };
    }
    return { live: false, note: `supabase error: ${error.message}` };
  } catch (err) {
    return { live: false, note: `supabase unreachable: ${err instanceof Error ? err.message : err}` };
  }
}

export async function GET() {
  const persistence = await probeSupabase();
  return NextResponse.json({
    ok: true,
    engineVersion: ENGINE_VERSION,
    rubricVersion: RUBRIC_VERSION,
    layers: {
      orchestrator: { live: true, note: "8 sub-agents, deterministic core" },
      rubric: { live: true, note: "published at /api/rubric" },
      analysis: { live: true, note: "deterministic engine, pure function of domain" },
      sourcing: {
        live: true,
        mode: "simulated",
        note: `${UNIVERSE.length} companies in demo sourcing plane — swap for Apollo/Clay/crawler adapter`,
      },
      model: {
        live: aiConfigured(),
        provider: "gemini",
        chain: (process.env.GEMINI_MODELS ?? "gemini-2.5-flash,gemini-2.0-flash").split(","),
        note: aiConfigured() ? "copy + research rewrite active" : "deterministic copy fallback active",
      },
      crm: { live: true, provider: crm().name, note: "adapter interface — HubSpot/Salesforce swap in phase 2" },
      persistence,
      email: { live: Boolean(process.env.RESEND_API_KEY), note: "sending gated behind human approval in v1" },
    },
  });
}

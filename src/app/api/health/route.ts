import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai";
import { crm } from "@/lib/engine/crm";
import { ENGINE_VERSION } from "@/lib/engine/types";
import { UNIVERSE } from "@/lib/engine/universe";
import { RUBRIC_VERSION } from "@/lib/engine/scoring";
import { supabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export function GET() {
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
      persistence: {
        live: supabaseConfigured(),
        note: supabaseConfigured() ? "supabase" : "in-memory (demo runs without credentials)",
      },
      email: { live: Boolean(process.env.RESEND_API_KEY), note: "sending gated behind human approval in v1" },
    },
  });
}

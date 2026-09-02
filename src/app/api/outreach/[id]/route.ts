import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai";
import { crm } from "@/lib/engine/crm";
import { sequenceFor } from "@/lib/engine/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(request.url);
  const useAi = url.searchParams.get("ai") !== "0" && aiConfigured();

  const sequence = await sequenceFor(id, useAi);
  if (!sequence) return NextResponse.json({ error: "unknown prospect" }, { status: 404 });

  await crm().logActivity({
    domain: id,
    verb: "sequence_generated",
    detail: `${sequence.touches.length} touches · ${sequence.generatedBy} · angle ${sequence.angle}`,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ sequence, aiAvailable: aiConfigured() });
}

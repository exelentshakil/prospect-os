import { NextResponse } from "next/server";
import { crm } from "@/lib/engine/crm";
import { buildProspect } from "@/lib/engine/orchestrator";
import type { Stage } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

const STAGES: Stage[] = ["sourced", "qualified", "contacted", "replied", "call_booked", "parked"];

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await request.json()) as { stage?: string };
  const stage = body.stage as Stage;
  if (!stage || !STAGES.includes(stage)) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }
  const prospect = buildProspect(id);
  if (!prospect) return NextResponse.json({ error: "unknown prospect" }, { status: 404 });

  const adapter = crm();
  await adapter.upsert({
    domain: prospect.company.domain,
    company: prospect.company.name,
    stage,
    score: prospect.score.score,
    tier: prospect.score.tier,
    owner: "outbound-agent",
    updatedAt: new Date().toISOString(),
  });
  await adapter.updateStage(prospect.company.domain, stage);

  return NextResponse.json({ ok: true, stage, provider: adapter.name });
}

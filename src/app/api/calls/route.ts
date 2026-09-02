import { NextResponse } from "next/server";
import { book, listBookings, slots } from "@/lib/engine/calendar";
import { crm } from "@/lib/engine/crm";
import { buildProspect } from "@/lib/engine/orchestrator";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ slots: slots(), bookings: listBookings() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { domain?: string; slot?: string };
  if (!body.domain || !body.slot) {
    return NextResponse.json({ error: "domain and slot required" }, { status: 400 });
  }
  const prospect = buildProspect(body.domain);
  if (!prospect) return NextResponse.json({ error: "unknown prospect" }, { status: 404 });

  const agenda = [
    `Competitive position vs ${prospect.analysis.competitors[0].name} (visibility ${prospect.analysis.visibilityIndex} to ${prospect.analysis.competitors[0].visibility})`,
    `${prospect.leakage.findings.length} leakage findings totalling $${prospect.leakage.totalMonthly.toLocaleString()}/mo`,
    `Weakest cluster: "${prospect.analysis.weakPositions[0].cluster}" — position ${prospect.analysis.weakPositions[0].prospectPosition}`,
    `90-day recovery sequencing and what it would cost`,
  ];

  const booking = await book({
    domain: prospect.company.domain,
    company: prospect.company.name,
    contact: `${prospect.contact.name}, ${prospect.contact.title}`,
    slot: body.slot,
    agenda,
    createdAt: new Date().toISOString(),
  });

  const adapter = crm();
  await adapter.updateStage(prospect.company.domain, "call_booked");
  await adapter.logActivity({
    domain: prospect.company.domain,
    verb: "call_booked",
    detail: `${new Date(body.slot).toUTCString()} · agenda built from the prepared analysis`,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, booking });
}

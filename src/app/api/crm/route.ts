import { NextResponse } from "next/server";
import { listBookings } from "@/lib/engine/calendar";
import { crm } from "@/lib/engine/crm";

export const dynamic = "force-dynamic";

export async function GET() {
  const adapter = crm();
  return NextResponse.json({
    provider: adapter.name,
    records: await adapter.list(),
    activity: (await adapter.activity()).slice(0, 60),
    bookings: listBookings(),
  });
}

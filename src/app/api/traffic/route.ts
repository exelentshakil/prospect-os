import { NextResponse } from "next/server";
import { isMissingTable, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Body {
  path?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false });
  }

  const db = supabase();
  if (!db) return NextResponse.json({ ok: true, stored: false });

  const headerIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const ip = body.ip || headerIp || "unknown";

  let city: string | null = null;
  let region: string | null = null;
  let country: string | null = null;
  if (ip && ip !== "unknown" && !ip.startsWith("127.") && !ip.startsWith("::1")) {
    try {
      const geo = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
        signal: AbortSignal.timeout(2500),
      });
      if (geo.ok) {
        const data = await geo.json();
        city = data.city ?? null;
        region = data.regionName ?? null;
        country = data.country ?? null;
      }
    } catch {
      // geo is a nicety, never a reason to drop the log line
    }
  }

  const { error } = await db.from("traffic_logs").insert({
    path: body.path ?? "/",
    ip,
    city,
    region,
    country,
    user_agent: body.userAgent ?? request.headers.get("user-agent") ?? "",
    referrer: body.referrer ?? "",
  });

  if (error && !isMissingTable(error)) {
    return NextResponse.json({ ok: false, stored: false });
  }
  return NextResponse.json({ ok: true, stored: !error });
}

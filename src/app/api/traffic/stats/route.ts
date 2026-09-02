import { NextResponse } from "next/server";
import { isMissingTable, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Row {
  path: string;
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
}

const empty = {
  configured: false,
  visits: 0,
  uniqueIps: 0,
  live: 0,
  today: 0,
  series: [] as { day: string; count: number }[],
  paths: [] as { label: string; count: number }[],
  locations: [] as { label: string; count: number }[],
  recent: [] as Row[],
};

function tally(rows: Row[], key: (r: Row) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export async function GET() {
  const db = supabase();
  if (!db) return NextResponse.json(empty);

  const { data, error } = await db
    .from("traffic_logs")
    .select("path, ip, city, region, country, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    if (isMissingTable(error)) return NextResponse.json({ ...empty, configured: true, pendingSql: true });
    return NextResponse.json({ ...empty, configured: true });
  }

  const rows = (data ?? []) as Row[];
  const now = Date.now();
  const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
  const days = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    days.set(new Date(now - i * 86400000).toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = dayKey(r.created_at);
    if (days.has(k)) days.set(k, (days.get(k) ?? 0) + 1);
  }

  return NextResponse.json({
    configured: true,
    visits: rows.length,
    uniqueIps: new Set(rows.map((r) => r.ip)).size,
    live: rows.filter((r) => now - new Date(r.created_at).getTime() < 5 * 60000).length,
    today: rows.filter((r) => dayKey(r.created_at) === new Date().toISOString().slice(0, 10)).length,
    series: Array.from(days.entries()).map(([day, count]) => ({ day, count })),
    paths: tally(rows, (r) => r.path),
    locations: tally(rows, (r) => [r.city, r.country].filter(Boolean).join(", ")),
    recent: rows.slice(0, 25),
  });
}

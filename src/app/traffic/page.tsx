"use client";

import { useEffect, useState } from "react";

interface Row {
  path: string;
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Stats {
  configured: boolean;
  pendingSql?: boolean;
  visits: number;
  uniqueIps: number;
  live: number;
  today: number;
  series: { day: string; count: number }[];
  paths: { label: string; count: number }[];
  locations: { label: string; count: number }[];
  recent: Row[];
}

export default function TrafficPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/traffic/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(1, ...(stats?.series ?? []).map((s) => s.count));

  return (
    <div className="-mx-5 -my-8 min-h-screen bg-[#07090e] px-5 py-8 text-[#eef1f6]">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Traffic</h1>
            <p className="mt-1 text-sm text-[#6b7688]">
              {stats?.configured
                ? stats.pendingSql
                  ? "Supabase connected — run supabase_traffic.sql to start collecting."
                  : "Live, refreshing every 20s."
                : "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."}
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs text-[#98a2b3]">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#34d3a3]" />
            {stats?.live ?? 0} active now
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Visits", stats?.visits ?? 0],
            ["Unique IPs", stats?.uniqueIps ?? 0],
            ["Today", stats?.today ?? 0],
            ["Live", stats?.live ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl border border-[#232a37] bg-[#12161f] p-4">
              <p className="text-[11px] uppercase tracking-wider text-[#6b7688]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tnum">{value as number}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-[#232a37] bg-[#12161f] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[#6b7688]">Last 14 days</p>
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {(stats?.series ?? []).map((s) => (
              <div key={s.day} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-[#6b7688] opacity-0 transition group-hover:opacity-100 tnum">
                  {s.count}
                </span>
                <div
                  className="w-full rounded-t bg-[#8b83ff] transition-all"
                  style={{ height: `${Math.max(3, (s.count / max) * 100)}%`, opacity: s.count ? 1 : 0.25 }}
                />
                <span className="text-[9px] text-[#6b7688]">{s.day.slice(8)}</span>
              </div>
            ))}
            {!stats?.series.length ? (
              <p className="w-full text-center text-sm text-[#6b7688]">No data yet.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[
            ["Top paths", stats?.paths ?? []],
            ["Top locations", stats?.locations ?? []],
          ].map(([title, rows]) => {
            const list = rows as { label: string; count: number }[];
            const top = Math.max(1, ...list.map((r) => r.count));
            return (
              <div key={title as string} className="rounded-2xl border border-[#232a37] bg-[#12161f] p-5">
                <p className="text-[11px] uppercase tracking-wider text-[#6b7688]">{title as string}</p>
                <div className="mt-3 space-y-2.5">
                  {list.map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[13px]">
                        <span className="truncate text-[#98a2b3]">{r.label}</span>
                        <span className="tnum">{r.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1a1f2b]">
                        <div
                          className="h-full rounded-full bg-[#34d3a3]"
                          style={{ width: `${(r.count / top) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!list.length ? <p className="py-4 text-sm text-[#6b7688]">Nothing yet.</p> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-[#232a37] bg-[#12161f] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[#6b7688]">Recent</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[10px] uppercase tracking-wider text-[#6b7688]">
                <tr>
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">Path</th>
                  <th className="py-2 font-medium">Location</th>
                  <th className="py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent ?? []).map((r, i) => (
                  <tr key={i} className="border-t border-[#1a1f2b]">
                    <td className="py-2 text-[#98a2b3] tnum">
                      {new Date(r.created_at).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2">{r.path}</td>
                    <td className="py-2 text-[#98a2b3]">
                      {[r.city, r.region, r.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2 text-[#6b7688] tnum">{r.ip}</td>
                  </tr>
                ))}
                {!stats?.recent.length ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#6b7688]">
                      No visits recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

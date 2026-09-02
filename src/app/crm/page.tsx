"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, Database, Loader2 } from "lucide-react";
import { Badge, SectionTitle, StageBadge, Tile } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CrmRecord {
  domain: string;
  company: string;
  stage: string;
  score: number;
  tier: string;
  owner: string;
  updatedAt: string;
}

interface Activity {
  domain: string;
  verb: string;
  detail: string;
  at: string;
}

interface Booking {
  domain: string;
  company: string;
  contact: string;
  slot: string;
  agenda: string[];
}

const STAGES = ["sourced", "qualified", "contacted", "replied", "call_booked", "parked"];

export default function CrmPage() {
  const [data, setData] = useState<{
    provider: string;
    records: CrmRecord[];
    activity: Activity[];
    bookings: Booking[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/crm")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const records = data?.records ?? [];
  const byStage = (s: string) => records.filter((r) => r.stage === s);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Badge tone="accent">
            <Database size={11} /> adapter · {data?.provider ?? "demo-crm"}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">CRM</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Every record here was written by the crm-agent during a pipeline run. The orchestrator
            only ever calls the adapter interface, so a HubSpot or Salesforce swap in phase 2 lands
            in one file and leaves the agent, rubric and trace untouched.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Records" value={records.length} sub="upserted by crm-agent" />
        <Tile label="Qualified" value={byStage("qualified").length} sub="above rubric threshold" tone="accent" />
        <Tile label="Calls booked" value={data?.bookings.length ?? 0} sub="agenda from the analysis" tone="good" />
        <Tile label="Activities" value={data?.activity.length ?? 0} sub="logged this session" />
      </section>

      <section>
        <SectionTitle hint="drag-free board — stages are set by the agent or from a prospect page">
          Pipeline board
        </SectionTitle>
        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => (
            <div key={stage} className="card p-3">
              <div className="mb-2 flex items-center justify-between">
                <StageBadge stage={stage} />
                <span className="text-xs text-faint tnum">{byStage(stage).length}</span>
              </div>
              <div className="space-y-2">
                {byStage(stage).map((r) => (
                  <Link
                    key={r.domain}
                    href={`/prospects/${r.domain.split(".")[0]}`}
                    className="block rounded-lg border border-border bg-surface-2/60 p-2.5 transition hover:border-accent/40"
                  >
                    <p className="truncate text-[13px] font-medium">{r.company}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                      <span className="tnum">{r.score}</span>
                      <span
                        className={cn(
                          "rounded px-1",
                          r.tier === "A" ? "bg-good-soft text-good" : "bg-surface-2 text-faint"
                        )}
                      >
                        {r.tier}
                      </span>
                    </p>
                  </Link>
                ))}
                {!byStage(stage).length ? (
                  <p className="py-3 text-center text-[11px] text-faint">empty</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle hint="most recent first">Activity log</SectionTitle>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {(data?.activity ?? []).map((a, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border px-3 py-2">
                <Badge tone={a.verb === "call_booked" ? "good" : "neutral"}>{a.verb}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.domain}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
              </div>
            ))}
            {!data ? (
              <p className="flex items-center gap-2 py-6 text-sm text-faint">
                <Loader2 size={14} className="animate-spin" /> Loading records…
              </p>
            ) : null}
            {data && !data.activity.length ? (
              <p className="py-6 text-center text-sm text-faint">
                No activity yet — run the pipeline from the dashboard.
              </p>
            ) : null}
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle hint="qualified calls">Booked reviews</SectionTitle>
          <div className="space-y-3">
            {(data?.bookings ?? []).map((b) => (
              <div key={b.slot + b.domain} className="rounded-xl border border-border p-3.5">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={14} className="text-good" />
                  <span className="text-[13px] font-semibold">{b.company}</span>
                  <span className="ml-auto text-xs text-muted">
                    {new Date(b.slot).toLocaleString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-faint">{b.contact}</p>
                <ul className="mt-2 space-y-1">
                  {b.agenda.map((a) => (
                    <li key={a} className="flex gap-2 text-xs text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {data && !data.bookings.length ? (
              <p className="py-6 text-center text-sm text-faint">
                No calls booked yet — open a prospect and book the review.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

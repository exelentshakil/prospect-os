"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Cpu,
  Loader2,
  Play,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Badge, Bar, ScoreRing, SectionTitle, Sparkline, StageBadge, Tile } from "@/components/ui";
import { compact, money, cn } from "@/lib/utils";
import type { Prospect, TraceStep } from "@/lib/engine/types";

interface RunResult {
  runId: string;
  durationMs: number;
  trace: TraceStep[];
  prospects: Prospect[];
  marketRead: string;
  counts: { sourced: number; analysed: number; qualified: number; parked: number; synced: number };
  aiLive: boolean;
  icp: { industries: string[]; employeeMin: number; employeeMax: number; minScore: number };
}

const AGENTS = [
  ["sourcing-agent", "crawl + firmographic filter"],
  ["research-agent", "positioning + signal summary"],
  ["seo-agent", "visibility, trajectory, competitor map"],
  ["leakage-agent", "conversion + competitor leakage"],
  ["scoring-agent", "weighted rubric v1.0.0"],
  ["strategy-agent", "angle selection from computed facts"],
  ["copy-agent", "5-touch sequence, facts locked"],
  ["crm-agent", "upsert record, stage, activity log"],
];

const ALL_INDUSTRIES = [
  "Home Services",
  "Healthcare",
  "Legal",
  "Financial Services",
  "B2B SaaS",
  "Logistics",
  "Manufacturing",
  "Ecommerce",
  "Real Estate",
];

export default function Home() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [industries, setIndustries] = useState<string[]>([
    "Home Services",
    "Healthcare",
    "Legal",
    "Financial Services",
    "B2B SaaS",
  ]);
  const [minScore, setMinScore] = useState(62);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // `fresh` is false on the auto-run at mount so a page load never bills a
  // model call, and true when someone actually clicks Run the agent.
  const run = useCallback(
    (fresh = false) => {
    setRunning(true);
    setRevealed(0);
    setResult(null);
    fetch("/api/pipeline/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industries, minScore, fresh }),
    })
      .then((r) => r.json())
      .then((data: RunResult) => {
        setResult(data);
        setRunning(false);
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
          setRevealed((n) => {
            if (n >= data.trace.length) {
              if (timer.current) clearInterval(timer.current);
              return n;
            }
            return n + 1;
          });
        }, 170);
      })
      .catch(() => setRunning(false));
    },
    [industries, minScore]
  );

  useEffect(() => {
    run(false);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // first paint only — subsequent runs are user-triggered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prospects = result?.prospects ?? [];
  const qualified = prospects.filter((p) => p.score.qualified);
  const totalLeakage = prospects.reduce((s, p) => s + p.leakage.totalMonthly, 0);
  const avgScore = prospects.length
    ? Math.round((prospects.reduce((s, p) => s + p.score.score, 0) / prospects.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge tone="accent">
              <Cpu size={11} /> 8 sub-agents
            </Badge>
            <Badge tone={result?.aiLive ? "good" : "neutral"}>
              {result?.aiLive ? "model live" : "deterministic fallback"}
            </Badge>
            <Badge tone="neutral">rubric v1.0.0</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            ICP in. Booked call out.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            The rubric decides who is qualified, not the model. Every number below is produced by
            deterministic code with its arithmetic attached, so a rep can defend it on the call.
            The model only writes sentences around facts it is forbidden to invent.
          </p>
        </div>

        <div className="card w-full max-w-sm p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">ICP filter</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ALL_INDUSTRIES.map((i) => {
              const on = industries.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setIndustries((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i]))
                  }
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-medium transition",
                    on
                      ? "border-accent/30 bg-accent-soft text-accent"
                      : "border-border text-muted hover:text-text"
                  )}
                >
                  {i}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-muted">Qualify at</span>
            <input
              type="range"
              min={40}
              max={90}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-8 text-right text-sm font-semibold tnum">{minScore}</span>
          </div>
          <button
            type="button"
            onClick={() => run(true)}
            disabled={running}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Agents running" : "Run the agent"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Sourced" value={result?.counts.sourced ?? "—"} sub="passed ICP filter" />
        <Tile
          label="Qualified"
          value={result?.counts.qualified ?? "—"}
          sub={`threshold ${minScore} · ${result?.counts.parked ?? 0} parked`}
          tone="accent"
        />
        <Tile
          label="Leakage detected"
          value={totalLeakage ? compact(totalLeakage) + "/mo" : "—"}
          sub={`${compact(totalLeakage * 12)} annualised across pipeline`}
          tone="bad"
        />
        <Tile
          label="Run time"
          value={result ? `${(result.durationMs / 1000).toFixed(2)}s` : "—"}
          sub={`avg score ${avgScore} · ${result?.runId ?? ""}`}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="card p-5">
          <SectionTitle hint={result ? `${result.trace.length} steps` : "queued"}>
            Orchestration trace
          </SectionTitle>
          <ol className="space-y-2">
            {AGENTS.map(([agent, role], i) => {
              const step = result?.trace[i];
              const shown = i < revealed && step;
              return (
                <li
                  key={agent}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                    shown ? "rise border-border bg-surface-2/60" : "border-dashed border-border opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold",
                      shown ? "bg-good-soft text-good" : "bg-surface-2 text-faint"
                    )}
                  >
                    {shown ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold">{agent}</span>
                      <Badge tone={step?.mode === "model-backed" ? "accent" : "neutral"}>
                        {step?.mode ?? "queued"}
                      </Badge>
                      {shown ? (
                        <span className="ml-auto text-[11px] text-faint tnum">{step.durationMs}ms</span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-faint">{role}</p>
                    {shown ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.output}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <SectionTitle hint={result?.aiLive ? "model-written" : "deterministic fallback"}>
              Market read
            </SectionTitle>
            {result ? (
              <p className="text-[13px] leading-relaxed text-muted">{result.marketRead}</p>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-surface-2" />
              </div>
            )}
          </div>

          <div className="card p-5">
            <SectionTitle>Where the money leaks</SectionTitle>
            <div className="space-y-3">
              {[
                { label: "Competitor leakage", value: prospects.reduce((s, p) => s + p.leakage.competitorMonthly, 0), tone: "bad" as const },
                { label: "Conversion leakage", value: prospects.reduce((s, p) => s + p.leakage.conversionMonthly, 0), tone: "warn" as const },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-muted">{row.label}</span>
                    <span className="font-semibold tnum">{money(row.value)}/mo</span>
                  </div>
                  <Bar className="mt-1.5" value={row.value} max={Math.max(totalLeakage, 1)} tone={row.tone} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-faint">
              Each finding carries the arithmetic that produced it. Open any prospect to read the
              basis string behind every dollar.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle hint={`${qualified.length} of ${prospects.length} above threshold`}>
          Scored prospects
        </SectionTitle>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-[13px]">
              <thead className="border-b border-border text-[11px] uppercase tracking-wider text-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">12-mo visibility</th>
                  <th className="px-4 py-3 font-medium">Top competitor</th>
                  <th className="px-4 py-3 text-right font-medium">Leakage/mo</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {prospects.map((p, i) => (
                  <tr
                    key={p.id}
                    className="rise border-b border-border/60 last:border-0 hover:bg-surface-2/50"
                    style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/prospects/${p.id}`} className="font-medium hover:text-accent">
                        {p.company.name}
                      </Link>
                      <p className="text-xs text-faint">
                        {p.company.subvertical} · {p.company.city}, {p.company.region} ·{" "}
                        {p.company.employees} staff
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ScoreRing score={p.score.score} size={40} />
                        <Badge tone={p.score.tier === "A" ? "good" : p.score.tier === "B" ? "accent" : "neutral"}>
                          tier {p.score.tier}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Sparkline
                          points={p.analysis.trajectory}
                          tone={p.analysis.trajectoryDelta < 0 ? "bad" : "good"}
                          width={110}
                          height={32}
                        />
                        <span
                          className={cn(
                            "flex items-center gap-0.5 text-xs font-medium tnum",
                            p.analysis.trajectoryDelta < 0 ? "text-bad" : "text-good"
                          )}
                        >
                          {p.analysis.trajectoryDelta < 0 ? <TrendingDown size={12} /> : <Zap size={12} />}
                          {p.analysis.trajectoryDelta}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.analysis.competitors[0].name}</p>
                      <p className="text-xs text-faint tnum">
                        visibility {p.analysis.competitors[0].visibility} vs {p.analysis.visibilityIndex}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-bad tnum">{money(p.leakage.totalMonthly)}</span>
                      <p className="text-xs text-faint tnum">{p.leakage.findings.length} findings</p>
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={p.stage} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/prospects/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        Open <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!prospects.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-faint">
                      <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
                      Sourcing, analysing and scoring…
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
          <Sparkles size={12} />
          Scores are reproducible: rerun and every number returns identical, because the rubric is
          code rather than a prompt.
        </p>
      </section>
    </div>
  );
}

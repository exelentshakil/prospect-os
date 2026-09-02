"use client";

import { useState } from "react";
import { ChevronDown, Clock, FileText, Layers, Lock, Plug, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { name: "Phase 0 · Working demo", hours: "26 hrs", cost: "Freelance", done: true },
  { name: "Phase 1 · Live data plane", hours: "42 hrs", cost: "$6,300" },
  { name: "Phase 2 · CRM integration", hours: "30 hrs", cost: "$4,500" },
  { name: "Phase 3 · Outreach execution", hours: "46 hrs", cost: "$6,900" },
  { name: "Phase 4 · Booking + call brief", hours: "20 hrs", cost: "$3,000" },
  { name: "Phase 5 · Autonomy + feedback loop", hours: "32 hrs", cost: "$4,800" },
];

const DECISIONS = [
  {
    icon: Lock,
    title: "Deterministic rubric",
    body: "Qualification is code with published weights, not model output. Same prospect, same score, every run.",
  },
  {
    icon: FileText,
    title: "Fact-locked copy",
    body: "The copy agent is handed a fact sheet and blocked from emitting any dollar figure that is not on it.",
  },
  {
    icon: Plug,
    title: "Adapter boundary",
    body: "CRM, enrichment, SERP and model sit behind interfaces. Swapping HubSpot in touches one file.",
  },
  {
    icon: Layers,
    title: "Zero-credential demo",
    body: "The whole loop runs with no API keys. /api/health reports exactly which layers are live.",
  },
];

const COVER_LETTER = `you said it yourself: not a chatbot. the fear is an agent that writes confident emails nobody can defend on the call.

live: https://prospect-os.vercel.app
code: https://github.com/exelentshakil/prospect-os
portfolio: https://shakilhq.com

i built the loop before writing this. it sources against an ICP, maps the 3 to 4 competitors above each prospect, computes organic visibility and 12 month trajectory, prices conversion leakage and competitor leakage in dollars per month, scores against a published rubric, writes a 5 touch sequence, upserts the CRM record and books the call. eight named sub-agents, every step traced.

the part that matters: the rubric decides who is qualified, not the model. every number carries the arithmetic that produced it, and the copy agent is blocked from writing a dollar figure that is not on the fact sheet. your rep can defend every claim live on the call.

honest gap: the sourcing plane and SERP data are simulated, sending is not wired up, and the CRM is the demo adapter. that is phases 1 to 3, roughly six weeks at 30 hrs a week to a live system on your own data. $25,500 all in, and phase 0 above is free.

which CRM are you on, and is Montreal the first market or all of canada? twenty minutes and i can walk you through the trace running.`;

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mt-20 border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Proposal · Autonomous Sales Agent &amp; Prospecting Engine
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Built by Shakil Ahmed · BarakahSoft LLC
            </h2>
          </div>
          <div className="flex gap-8">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
                <Clock size={12} /> Total build time
              </div>
              <p className="mt-1 text-2xl font-semibold tnum">170 hrs</p>
              <p className="text-xs text-muted">~6 weeks at 30 hrs/week</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
                <Wallet size={12} /> Total investment
              </div>
              <p className="mt-1 text-2xl font-semibold tnum">$25,500</p>
              <p className="text-xs text-muted">$150/hr · phase 0 free</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((p) => (
            <div
              key={p.name}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3",
                p.done ? "border-good/40 bg-good-soft" : "border-border bg-surface"
              )}
            >
              <span className="text-[13px] font-medium">{p.name}</span>
              <span className="flex items-center gap-3 text-[13px] tnum">
                <span className="text-muted">{p.hours}</span>
                <span className={cn("font-semibold", p.done && "text-good")}>{p.cost}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DECISIONS.map((d) => (
            <div key={d.title} className="card p-4">
              <d.icon size={16} className="text-accent" />
              <h3 className="mt-3 text-[13px] font-semibold">{d.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left text-[13px] font-medium transition hover:border-border-strong"
          >
            <span>Read the cover letter</span>
            <ChevronDown size={16} className={cn("text-muted transition", open && "rotate-180")} />
          </button>
          {open && (
            <pre className="rise mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-solid p-5 text-[13px] leading-relaxed text-muted">
              {COVER_LETTER}
            </pre>
          )}
        </div>

        <p className="mt-10 text-xs text-faint">
          Demo data plane is simulated and every company shown is fictional. Live crawl, SERP,
          sending and CRM providers arrive in phases 1 to 3 behind the same adapters.
        </p>
      </div>
    </footer>
  );
}

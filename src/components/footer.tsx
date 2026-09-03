"use client";

import { useState } from "react";
import { ChevronDown, FileText, Layers, Lock, Plug, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mt-20 border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Autonomous Sales Agent &amp; Prospecting Engine
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Built by Shakil Ahmed · BarakahSoft LLC
            </h2>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="mt-1 text-2xl font-semibold tnum text-accent">Enterprise</p>
              <p className="text-xs text-muted">Scalable Architecture</p>
            </div>
          </div>
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
            <span>Read Implementation Architecture</span>
            <ChevronDown size={16} className={cn("text-muted transition", open && "rotate-180")} />
          </button>
          {open && (
            <div className="rise mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-solid p-5 text-[13px] leading-relaxed text-muted">
              What you are looking at is the chassis for an outbound engine capable of generating millions in pipeline. By strictly tracing every claim back to hard SERP arithmetic and forcing the AI to operate within rigid qualification rubrics, we are building a highly scalable, autonomous SDR team that never hallucinates an offer. Let's discuss which CRM you are on and how we adapt this engine to your first market.
            </div>
          )}
        </div>

        <p className="mt-10 text-xs text-faint">
          Demo data plane is simulated and every company shown is fictional. Live crawl, SERP,
          sending and CRM providers arrive behind the same adapters for production.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, Loader2, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { Badge, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Sequence, Stage } from "@/lib/engine/types";

const STAGES: Stage[] = ["sourced", "qualified", "contacted", "replied", "call_booked", "parked"];

export function SequencePanel({
  prospectId,
  initial,
  aiAvailable,
}: {
  prospectId: string;
  initial: Sequence;
  aiAvailable: boolean;
}) {
  const [sequence, setSequence] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(0);

  const regenerate = () => {
    setBusy(true);
    fetch(`/api/outreach/${prospectId}`, { method: "POST" })
      .then((r) => r.json())
      .then((d: { sequence?: Sequence }) => {
        if (d.sequence) setSequence(d.sequence);
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  return (
    <div className="card p-5">
      <SectionTitle hint={`${sequence.touches.length} touches · ${sequence.generatedBy}`}>
        Outreach sequence
      </SectionTitle>

      <div className="rounded-xl border border-border bg-surface-2/60 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
          Strategy · angle {sequence.angle}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{sequence.strategy}</p>
      </div>

      <div className="mt-4 space-y-2">
        {sequence.touches.map((t, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center gap-3 bg-surface-2/50 px-3 py-2.5 text-left transition hover:bg-surface-2"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent-soft text-[11px] font-semibold text-accent">
                {t.day}d
              </span>
              {t.channel === "email" ? (
                <Mail size={13} className="text-faint" />
              ) : (
                <MessageSquare size={13} className="text-faint" />
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{t.subject}</span>
              <Badge tone="neutral">{t.channel}</Badge>
            </button>
            {open === i ? (
              <div className="border-t border-border px-4 py-3">
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-muted">
                  {t.body}
                </pre>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.factsUsed.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] text-faint"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={regenerate}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] font-medium transition hover:border-border-strong disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Rewrite with the model
        </button>
        <p className="text-xs text-faint">
          {aiAvailable
            ? "Generated copy is validated against the fact sheet. A dollar figure that is not on the sheet fails the touch back to the deterministic version."
            : "No model key configured, so this is the deterministic sequence. The validation gate runs either way."}
        </p>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-faint hover:text-muted">
          Fact sheet handed to the copy agent ({Object.keys(sequence.factSheet).length} locked values)
        </summary>
        <dl className="mt-2 grid gap-x-6 gap-y-1 rounded-xl border border-border bg-surface-2/50 p-3 text-xs sm:grid-cols-2">
          {Object.entries(sequence.factSheet).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-faint">{k}</dt>
              <dd className="truncate text-right font-medium tnum">{v}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

export function CrmPanel({ prospectId, initialStage }: { prospectId: string; initialStage: Stage }) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [busy, setBusy] = useState<string | null>(null);
  const [provider, setProvider] = useState("demo-crm");

  const update = (next: Stage) => {
    setBusy(next);
    fetch(`/api/prospects/${prospectId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    })
      .then((r) => r.json())
      .then((d: { stage?: Stage; provider?: string }) => {
        if (d.stage) setStage(d.stage);
        if (d.provider) setProvider(d.provider);
      })
      .catch(() => {})
      .finally(() => setBusy(null));
  };

  return (
    <div className="card p-5">
      <SectionTitle hint={`provider · ${provider}`}>CRM record</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update(s)}
            disabled={busy !== null}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition disabled:opacity-60",
              stage === s
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border text-muted hover:text-text"
            )}
          >
            {busy === s ? (
              <Loader2 size={11} className="animate-spin" />
            ) : stage === s ? (
              <Check size={11} strokeWidth={3} />
            ) : null}
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        Writes go through the CRM adapter interface. Phase 2 swaps the demo store for HubSpot or
        Salesforce without touching the orchestrator or the rubric.
      </p>
    </div>
  );
}

interface Slot {
  start: string;
  label: string;
  taken: boolean;
}

export function BookingPanel({ prospectId, company }: { prospectId: string; company: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [booked, setBooked] = useState<{ slot: string; agenda: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/calls")
      .then((r) => r.json())
      .then((d: { slots?: Slot[] }) => setSlots(d.slots ?? []))
      .catch(() => {});
  }, []);

  const bookSlot = (slot: string) => {
    setBusy(true);
    fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: prospectId, slot }),
    })
      .then((r) => r.json())
      .then((d: { booking?: { slot: string; agenda: string[] } }) => {
        if (d.booking) setBooked(d.booking);
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  if (booked) {
    return (
      <div className="card p-5">
        <SectionTitle hint="stage moved to call_booked">Call booked</SectionTitle>
        <div className="flex items-center gap-2 text-[13px] font-medium text-good">
          <CalendarCheck size={15} />
          {new Date(booked.slot).toLocaleString("en-CA", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-faint">
          Agenda built from the prepared analysis
        </p>
        <ul className="mt-2 space-y-1.5">
          {booked.agenda.map((a) => (
            <li key={a} className="flex gap-2 text-[13px] text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
              {a}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <SectionTitle hint="qualified call">Book the review</SectionTitle>
      <p className="mb-3 text-[13px] leading-relaxed text-muted">
        The call is framed as a walkthrough of the analysis already prepared for {company}, which is
        why it converts better than a discovery ask.
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {slots.slice(0, 6).map((s) => (
          <button
            key={s.start}
            type="button"
            disabled={s.taken || busy}
            onClick={() => bookSlot(s.start)}
            className="rounded-lg border border-border px-2 py-2 text-[12px] font-medium transition hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {s.label}
          </button>
        ))}
        {!slots.length ? <p className="text-xs text-faint">Loading slots…</p> : null}
      </div>
    </div>
  );
}

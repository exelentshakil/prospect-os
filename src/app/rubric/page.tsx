import { ExternalLink, Lock } from "lucide-react";
import { DEFAULT_ICP } from "@/lib/engine/icp";
import { RUBRIC } from "@/lib/engine/scoring";
import { Badge, Bar, SectionTitle } from "@/components/ui";

export const metadata = {
  title: "Rubric — Prospect OS",
};

const PILLARS = ["fit", "pain", "timing", "reachability"] as const;
const PILLAR_COPY: Record<string, string> = {
  fit: "Is this the kind of company we serve at all?",
  pain: "Is there a problem large enough to pay to fix?",
  timing: "Is it getting worse right now?",
  reachability: "Can we actually get to the person who decides?",
};

export default function RubricPage() {
  const total = RUBRIC.components.reduce((s, c) => s + c.weight, 0);

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Badge tone="accent">
          <Lock size={11} /> published qualification logic
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          What decides who gets contacted
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          This page is the whole qualification layer. It is deterministic code with published
          weights, not a prompt, so the same prospect scores identically on every run and no model
          edit can quietly move the bar. Change a weight here and the pipeline changes; change a
          prompt and nothing on this page moves.
        </p>
        <a
          href="/api/rubric"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline"
        >
          Audit it as JSON <ExternalLink size={13} />
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <SectionTitle hint={`${total} points total · v${RUBRIC.version}`}>
            Weighted components
          </SectionTitle>
          <div className="space-y-6">
            {PILLARS.map((pillar) => {
              const rows = RUBRIC.components.filter((c) => c.pillar === pillar);
              const weight = rows.reduce((s, c) => s + c.weight, 0);
              return (
                <div key={pillar}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[13px] font-semibold capitalize">{pillar}</h3>
                    <span className="text-xs text-faint tnum">{weight} pts</span>
                  </div>
                  <p className="mt-0.5 text-xs text-faint">{PILLAR_COPY[pillar]}</p>
                  <div className="mt-2.5 space-y-2">
                    {rows.map((c) => (
                      <div key={c.code}>
                        <div className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="text-muted">{c.label}</span>
                          <span className="shrink-0 font-medium tnum">{c.weight}</span>
                        </div>
                        <Bar className="mt-1" value={c.weight} max={18} tone="accent" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <SectionTitle>Tier thresholds</SectionTitle>
            <div className="space-y-2">
              {[
                ["A", RUBRIC.tiers.A, "contact immediately, senior rep", "good"],
                ["B", RUBRIC.tiers.B, "full sequence, standard cadence", "accent"],
                ["C", RUBRIC.tiers.C, "sequence, no manual research time", "warn"],
                ["D", 0, "parked, never contacted", "neutral"],
              ].map(([tier, min, note, tone]) => (
                <div
                  key={tier as string}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <Badge tone={tone as "good" | "accent" | "warn" | "neutral"}>tier {tier}</Badge>
                  <span className="text-[13px] font-medium tnum">{min}+</span>
                  <span className="ml-auto text-right text-xs text-muted">{note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <SectionTitle hint="editable, versioned">ICP definition</SectionTitle>
            <p className="text-[13px] font-medium">{DEFAULT_ICP.name}</p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div>
                <dt className="text-xs uppercase tracking-wider text-faint">Industries</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {DEFAULT_ICP.industries.map((i) => (
                    <Badge key={i} tone="neutral">
                      {i}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Headcount</dt>
                <dd className="font-medium tnum">
                  {DEFAULT_ICP.employeeMin}–{DEFAULT_ICP.employeeMax}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Regions</dt>
                <dd className="font-medium">{DEFAULT_ICP.regions.join(", ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Qualify at</dt>
                <dd className="font-medium tnum">{DEFAULT_ICP.minScore}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <SectionTitle>Buyer persona</SectionTitle>
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Titles</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {DEFAULT_ICP.persona.titles.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-faint">Pains</p>
            <ul className="mt-1.5 space-y-1">
              {DEFAULT_ICP.persona.pains.map((p) => (
                <li key={p} className="flex gap-2 text-[13px] text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-bad" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-faint">
              Triggers
            </p>
            <ul className="mt-1.5 space-y-1">
              {DEFAULT_ICP.persona.triggers.map((t) => (
                <li key={t} className="flex gap-2 text-[13px] text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-good" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

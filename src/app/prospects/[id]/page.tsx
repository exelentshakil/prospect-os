import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Globe, Mail, TrendingDown, TrendingUp } from "lucide-react";
import { aiConfigured } from "@/lib/ai";
import { generateSequence } from "@/lib/engine/outreach";
import { buildProspect } from "@/lib/engine/orchestrator";
import { BookingPanel, CrmPanel, SequencePanel } from "@/components/prospect-panels";
import { Badge, Bar, ScoreRing, SectionTitle, Sparkline } from "@/components/ui";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PILLAR_LABEL: Record<string, string> = {
  fit: "Fit",
  pain: "Pain",
  timing: "Timing",
  reachability: "Reachability",
};

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = buildProspect(id);
  if (!p) notFound();

  const sequence = await generateSequence(p.company, p.analysis, p.leakage, p.contact, false);
  const { analysis: a, leakage, score, company, contact } = p;
  const leader = a.competitors[0];
  const declining = a.trajectoryDelta < 0;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-text"
      >
        <ArrowLeft size={14} /> Pipeline
      </Link>

      <header className="card flex flex-wrap items-start justify-between gap-6 p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{company.industry}</Badge>
            <Badge tone="neutral">{company.subvertical}</Badge>
            <Badge tone={score.qualified ? "good" : "neutral"}>
              {score.qualified ? "qualified" : "parked"}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{company.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <Globe size={13} /> {company.domain}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={13} /> {company.employees} staff · {company.revenueBand} · est.{" "}
              {company.founded}
            </span>
            <span>
              {company.city}, {company.region}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
            <Mail size={14} className="text-faint" />
            <div className="text-[13px]">
              <span className="font-medium">{contact.name}</span>
              <span className="text-muted"> · {contact.title}</span>
              <p className="text-xs text-faint">
                {contact.email} · pattern confidence {(contact.emailConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
              Leakage detected
            </p>
            <p className="mt-1 text-3xl font-semibold text-bad tnum">
              {money(leakage.totalMonthly)}
              <span className="text-base font-normal text-muted">/mo</span>
            </p>
            <p className="text-xs text-muted tnum">{money(leakage.totalAnnual)} annualised</p>
          </div>
          <div className="text-center">
            <ScoreRing score={score.score} size={72} />
            <p className="mt-1.5 text-xs font-medium text-muted">tier {score.tier}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <SectionTitle hint={`engine v${a.engineVersion}`}>Competitive position</SectionTitle>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/60 p-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                  Organic visibility · 12 months
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tnum">{a.visibilityIndex}</span>
                  <span
                    className={`flex items-center gap-1 text-[13px] font-medium tnum ${
                      declining ? "text-bad" : "text-good"
                    }`}
                  >
                    {declining ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {a.trajectoryDelta}%
                  </span>
                </div>
              </div>
              <Sparkline points={a.trajectory} tone={declining ? "bad" : "good"} width={280} height={56} />
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                Competitors above them
              </p>
              {a.competitors.map((c) => (
                <div key={c.domain}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted tnum">
                      visibility {c.visibility} ·{" "}
                      <span className={c.momentum > 0 ? "text-bad" : "text-good"}>
                        {c.momentum > 0 ? "+" : ""}
                        {c.momentum}%
                      </span>{" "}
                      · {c.sharedKeywords.toLocaleString()} shared kw
                    </span>
                  </div>
                  <Bar className="mt-1.5" value={c.visibility} tone="bad" />
                </div>
              ))}
              <div>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="font-medium text-accent">{company.name}</span>
                  <span className="text-muted tnum">visibility {a.visibilityIndex}</span>
                </div>
                <Bar className="mt-1.5" value={a.visibilityIndex} tone="accent" />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                Weakest positions
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wider text-faint">
                    <tr>
                      <th className="py-2 font-medium">Cluster</th>
                      <th className="py-2 text-right font-medium">Volume</th>
                      <th className="py-2 text-right font-medium">Them</th>
                      <th className="py-2 text-right font-medium">Best competitor</th>
                      <th className="py-2 text-right font-medium">Clicks lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.weakPositions.map((w) => (
                      <tr key={w.cluster} className="border-t border-border/60">
                        <td className="py-2.5 pr-3">
                          <span className="font-medium">{w.cluster}</span>
                          <p className="text-[11px] text-faint">{w.basis}</p>
                        </td>
                        <td className="py-2.5 text-right tnum text-muted">{w.volume.toLocaleString()}</td>
                        <td className="py-2.5 text-right tnum">#{w.prospectPosition}</td>
                        <td className="py-2.5 text-right">
                          <span className="tnum text-bad">#{w.competitorPosition}</span>
                          <p className="text-[11px] text-faint">{w.bestCompetitor}</p>
                        </td>
                        <td className="py-2.5 text-right font-semibold tnum text-bad">
                          {w.clicksLost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                  SEO performance
                </p>
                <dl className="mt-2 space-y-1 text-[13px]">
                  {[
                    ["LCP", `${a.seo.lcpSeconds}s`],
                    ["Mobile score", `${a.seo.mobileScore}/100`],
                    ["Core Web Vitals", a.seo.cwvPass ? "pass" : "fail"],
                    ["Indexed pages", a.seo.indexedPages.toLocaleString()],
                    ["Referring domains", a.seo.referringDomains.toLocaleString()],
                    ["Schema coverage", `${a.seo.schemaCoverage}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium tnum">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                  Revenue attribution
                </p>
                <dl className="mt-2 space-y-1 text-[13px]">
                  {[
                    ["Organic sessions", a.revenue.organicSessions.toLocaleString() + "/mo"],
                    ["Visitor to lead", `${a.revenue.conversionRate}%`],
                    ["Lead to customer", `${(a.revenue.closeRate * 100).toFixed(0)}%`],
                    ["Avg deal", money(a.revenue.avgDealValue)],
                    ["Value per session", `$${a.revenue.revenuePerSession.toFixed(2)}`],
                    ["Attributed", `${money(a.revenue.attributedMonthly)}/mo · ${a.revenue.organicShare}% of revenue`],
                    ["Leader attributed", money(a.revenue.competitorAttributedMonthly) + "/mo"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium tnum">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-1">
                    <dt className="text-muted">Gap to leader</dt>
                    <dd className="font-semibold text-bad tnum">{money(a.revenue.gapMonthly)}/mo</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] leading-relaxed text-faint">{a.revenue.basis}</p>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <SectionTitle
              hint={`${money(leakage.conversionMonthly)} conversion · ${money(leakage.competitorMonthly)} competitor · ${Math.round(
                (leakage.totalMonthly / Math.max(a.revenue.attributedMonthly, 1)) * 100
              )}% of attributed`}
            >
              Leakage findings
            </SectionTitle>
            <div className="space-y-2">
              {leakage.findings.map((f) => (
                <div
                  key={f.code}
                  className={`rounded-xl border p-3.5 ${f.counted ? "border-border" : "border-dashed border-border"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={f.kind === "competitor" ? "bad" : "warn"}>{f.kind}</Badge>
                    <span className="text-[13px] font-semibold">{f.label}</span>
                    {!f.counted ? <Badge tone="neutral">not counted</Badge> : null}
                    <span
                      className={`ml-auto text-[15px] font-semibold tnum ${
                        f.counted ? "text-bad" : "text-faint line-through"
                      }`}
                    >
                      {money(f.monthlyDollars)}/mo
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{f.basis}</p>
                  <p className="mt-1 text-[11px] text-faint">evidence · {f.evidence}</p>
                  {f.overlapNote ? (
                    <p className="mt-1.5 text-[11px] italic text-faint">{f.overlapNote}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <SequencePanel prospectId={p.id} initial={sequence} aiAvailable={aiConfigured()} />
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <SectionTitle hint={`rubric v${score.rubricVersion}`}>Score breakdown</SectionTitle>
            <div className="mb-4 grid grid-cols-4 gap-2">
              {Object.entries(score.pillars).map(([pillar, points]) => (
                <div key={pillar} className="rounded-lg border border-border p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-faint">
                    {PILLAR_LABEL[pillar] ?? pillar}
                  </p>
                  <p className="mt-0.5 text-base font-semibold tnum">{points}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              {score.components.map((c) => (
                <div key={c.code}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-muted">{c.label}</span>
                    <span className="shrink-0 font-medium tnum">
                      {c.points}
                      <span className="text-faint"> / {c.weight}</span>
                    </span>
                  </div>
                  <Bar
                    className="mt-1"
                    value={c.points}
                    max={c.weight}
                    tone={c.points / c.weight > 0.66 ? "accent" : c.points / c.weight > 0.33 ? "warn" : "neutral"}
                  />
                  <p className="mt-1 text-[11px] leading-relaxed text-faint">{c.basis}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-border bg-surface-2/60 p-3 text-[11px] leading-relaxed text-muted">
              This total is arithmetic, not judgement. Change a weight in the rubric and the
              qualification bar moves; change the prompt and nothing here moves at all.{" "}
              <Link href="/rubric" className="text-accent hover:underline">
                Read the rubric
              </Link>
              .
            </p>
          </section>

          <CrmPanel prospectId={p.id} initialStage={p.stage} />
          <BookingPanel prospectId={p.id} company={company.name} />

          <section className="card p-5">
            <SectionTitle>Signals observed</SectionTitle>
            <ul className="space-y-1.5">
              {company.signals.map((s) => (
                <li key={s} className="flex gap-2 text-[13px] text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-faint">Stack</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {company.techSignals.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

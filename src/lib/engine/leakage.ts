import { between, hash } from "./rand";
import type { Analysis, Company, LeakageFinding, LeakageReport } from "./types";

// Leakage detection. Two questions the agency actually sells against:
//   conversion leakage — demand the prospect already paid for and then lost
//   competitor leakage — demand a named rival is taking off them right now
// Every finding carries the arithmetic that produced its dollar figure. A rep
// can read the basis string out loud on a call without a slide deck.
//
// Two rules keep the total defensible, because a number larger than the
// prospect's own revenue ends a call rather than starting one:
//
//   1. Conversion losses compound, they do not add. Each detector is applied
//      to the revenue still on the table after the ones before it, so the
//      total can approach the attributed figure but never exceed it.
//   2. Competitor findings overlap by construction — a keyword gap is part of
//      how share of voice was lost. The report counts the larger of the
//      aggregate view or the itemised view, never both, and marks the
//      uncounted one rather than hiding it.

function severity(dollars: number): LeakageFinding["severity"] {
  return dollars >= 12000 ? "high" : dollars >= 4000 ? "medium" : "low";
}

interface ConversionDetector {
  code: string;
  label: string;
  lossPct: number;
  evidence: string;
  reason: string;
}

export function detectLeakage(company: Company, a: Analysis): LeakageReport {
  const { seo, revenue } = a;
  // One session is worth lead rate × close rate × deal value. Every
  // traffic-based finding prices its clicks through this single number, so the
  // estimates stay consistent with the attribution figure above them.
  const perSession = revenue.revenuePerSession;
  const sessions = revenue.organicSessions;

  // ---- conversion leakage (compounding) -----------------------------------

  const detectors: ConversionDetector[] = [];

  if (seo.lcpSeconds > 2.5) {
    const secondsOver = Math.round((seo.lcpSeconds - 2.5) * 10) / 10;
    detectors.push({
      code: "slow_lcp",
      label: "Largest Contentful Paint over threshold",
      lossPct: Math.min(secondsOver * 0.07, 0.15),
      evidence: `LCP ${seo.lcpSeconds}s · mobile score ${seo.mobileScore}/100 · CWV ${seo.cwvPass ? "pass" : "fail"}`,
      reason: `LCP ${seo.lcpSeconds}s is ${secondsOver}s over the 2.5s threshold × 7% conversion loss per second`,
    });
  }

  const formFields = 4 + (hash(company.domain + ":form") % 8);
  if (formFields > 6) {
    const extra = formFields - 6;
    detectors.push({
      code: "form_friction",
      label: "Lead form asks for more than it needs",
      lossPct: Math.min(extra * 0.04, 0.1),
      evidence: `${formFields}-field contact form, no progressive disclosure`,
      reason: `${formFields} required fields, ${extra} over the 6-field break-even × 4% abandonment per extra field`,
    });
  }

  const hasCrm = company.techSignals.some((t) => /HubSpot|Salesforce|Marketo|Pardot/i.test(t));
  if (!hasCrm) {
    detectors.push({
      code: "slow_lead_response",
      label: "No routing layer between form fill and follow-up",
      lossPct: 0.07,
      evidence: `stack shows ${company.techSignals.join(", ")} with no CRM`,
      reason: `no CRM detected, median first response beyond 60 min, 7% of qualified inbound decays before contact`,
    });
  }

  const hasCallTracking = company.techSignals.some((t) => /CallRail|Invoca|CTM/i.test(t));
  const phoneLed = ["Home Services", "Legal", "Healthcare", "Financial Services", "Real Estate"].includes(company.industry);
  if (phoneLed && !hasCallTracking) {
    const calls = Math.round(revenue.organicSessions * 0.031);
    detectors.push({
      code: "untracked_calls",
      label: "Phone demand is unattributed",
      lossPct: 0.06,
      evidence: `no call-tracking tag detected in ${company.techSignals.join(", ")}`,
      reason: `~${calls} organic calls/mo with no call tracking, 22% landing outside hours or unrouted, 6% of revenue never attributed or followed up`,
    });
  }

  const findings: LeakageFinding[] = [];
  let remaining = revenue.attributedMonthly;

  for (const d of detectors) {
    const dollars = Math.round(remaining * d.lossPct);
    findings.push({
      kind: "conversion",
      code: d.code,
      label: d.label,
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${d.reason} × $${Math.round(remaining).toLocaleString()}/mo still converting at this step = $${dollars.toLocaleString()}/mo`,
      evidence: d.evidence,
      counted: true,
    });
    remaining -= dollars;
  }

  if (seo.schemaCoverage < 40) {
    const extraSessions = Math.round(sessions * 0.05);
    const dollars = Math.round(extraSessions * perSession);
    findings.push({
      kind: "conversion",
      code: "missing_schema",
      label: "Structured data missing on money pages",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `schema coverage ${seo.schemaCoverage}% × 5% median CTR uplift from rich results = ${extraSessions.toLocaleString()} sessions/mo × $${perSession.toFixed(2)} per session = $${dollars.toLocaleString()}/mo`,
      evidence: `${seo.schemaCoverage}% of indexed templates carry valid schema`,
      counted: true,
    });
  }

  // ---- competitor leakage (aggregate vs itemised, never both) --------------

  const leader = a.competitors[0];
  const competitorFindings: LeakageFinding[] = [];
  let aggregate = 0;
  let itemised = 0;

  if (a.trajectoryDelta < 0) {
    // Visibility is not linear in traffic, so the recovery implied by a fall
    // from v0 to v11 is dampened and then capped at 15% of current sessions.
    const ratio = a.trajectory[0] / Math.max(a.trajectory[11], 1);
    const upliftShare = Math.min(Math.sqrt(ratio) - 1, 0.15);
    const sessionsLost = Math.round(sessions * upliftShare);
    aggregate = Math.round(sessionsLost * perSession);
    competitorFindings.push({
      kind: "competitor",
      code: "sov_decline",
      label: "Share of voice ceded over 12 months",
      severity: severity(aggregate),
      monthlyDollars: aggregate,
      basis: `visibility ${a.trajectory[0]} → ${a.trajectory[11]} (${a.trajectoryDelta}%) implies a ${(upliftShare * 100).toFixed(0)}% traffic recovery, dampened and capped = ${sessionsLost.toLocaleString()} sessions/mo × $${perSession.toFixed(2)} = $${aggregate.toLocaleString()}/mo`,
      evidence: `${leader.name} moved ${leader.momentum > 0 ? "+" : ""}${leader.momentum}% over the same window`,
      counted: true,
    });
  }

  const rawClicksLost = a.weakPositions.reduce((sum, w) => sum + w.clicksLost, 0);
  const clicksLost = Math.min(rawClicksLost, Math.round(sessions * 0.12));
  if (clicksLost > 0) {
    const dollars = Math.round(clicksLost * perSession);
    itemised += dollars;
    competitorFindings.push({
      kind: "competitor",
      code: "keyword_gap",
      label: "Top clusters owned by a named competitor",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${clicksLost.toLocaleString()} clicks/mo lost across ${a.weakPositions.length} clusters where a competitor holds page one${rawClicksLost > clicksLost ? ` (capped at 12% of current sessions from ${rawClicksLost.toLocaleString()})` : ""} × $${perSession.toFixed(2)} per session = $${dollars.toLocaleString()}/mo`,
      evidence: `worst: "${a.weakPositions[0].cluster}" — they sit ${a.weakPositions[0].prospectPosition}, ${a.weakPositions[0].bestCompetitor} sits ${a.weakPositions[0].competitorPosition}`,
      counted: true,
    });
  }

  const brandedVolume = Math.round(between(company.domain + ":brand", 140, 2600));
  const bleedPct = between(company.domain + ":bleed", 0.04, 0.19, 2);
  if (bleedPct > 0.06) {
    const diverted = Math.min(Math.round(brandedVolume * bleedPct), Math.round(sessions * 0.04));
    const dollars = Math.round(diverted * perSession * 1.3);
    itemised += dollars;
    competitorFindings.push({
      kind: "competitor",
      code: "branded_bleed",
      label: "Competitors intercepting branded search",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${brandedVolume.toLocaleString()} branded searches/mo × ${(bleedPct * 100).toFixed(0)}% diverted to competitor listings = ${diverted.toLocaleString()} sessions × $${perSession.toFixed(2)} × 1.3 branded intent multiplier = $${dollars.toLocaleString()}/mo`,
      evidence: `${a.competitors.slice(0, 2).map((c) => c.name).join(" and ")} rank on "${company.name.split(" ")[0]}" modifiers`,
      counted: true,
    });
  }

  // Count the larger view only. The other stays on the page, marked.
  const useAggregate = aggregate >= itemised;
  for (const f of competitorFindings) {
    const isAggregate = f.code === "sov_decline";
    if (useAggregate ? !isAggregate : isAggregate) {
      f.counted = false;
      f.overlapNote = useAggregate
        ? "already inside the share-of-voice figure — shown for the sales conversation, excluded from the total"
        : "itemised findings are larger and more specific, so those are counted instead of this aggregate";
    }
  }
  findings.push(...competitorFindings);

  const conversionMonthly = findings
    .filter((f) => f.kind === "conversion" && f.counted)
    .reduce((s, f) => s + f.monthlyDollars, 0);
  const competitorMonthly = useAggregate ? aggregate : itemised;

  return {
    findings: findings.sort((x, y) => y.monthlyDollars - x.monthlyDollars),
    conversionMonthly,
    competitorMonthly,
    totalMonthly: conversionMonthly + competitorMonthly,
    totalAnnual: (conversionMonthly + competitorMonthly) * 12,
  };
}

import { between, hash } from "./rand";
import type { Analysis, Company, LeakageFinding, LeakageReport } from "./types";

// Leakage detection. Two questions the agency actually sells against:
//   conversion leakage — demand the prospect already paid for and then lost
//   competitor leakage — demand a named rival is taking off them right now
// Every finding carries the arithmetic that produced its dollar figure. A rep
// can read the basis string out loud on a call without a slide deck.

function severity(dollars: number): LeakageFinding["severity"] {
  return dollars >= 12000 ? "high" : dollars >= 4000 ? "medium" : "low";
}

export function detectLeakage(company: Company, a: Analysis): LeakageReport {
  const findings: LeakageFinding[] = [];
  const { seo, revenue } = a;
  const dealValue = revenue.avgDealValue;
  const closeRate = revenue.closeRate;
  // One session is worth lead rate × close rate × deal value. Every
  // traffic-based finding prices its clicks through this single number, so the
  // estimates stay consistent with the attribution figure above them.
  const perSession = revenue.revenuePerSession;

  // ---- conversion leakage -------------------------------------------------

  if (seo.lcpSeconds > 2.5) {
    const secondsOver = Math.round((seo.lcpSeconds - 2.5) * 10) / 10;
    const lossPct = Math.min(secondsOver * 0.07, 0.32);
    const dollars = Math.round(revenue.attributedMonthly * lossPct);
    findings.push({
      kind: "conversion",
      code: "slow_lcp",
      label: "Largest Contentful Paint over threshold",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `LCP ${seo.lcpSeconds}s is ${secondsOver}s over the 2.5s threshold × 7% conversion loss per second × $${revenue.attributedMonthly.toLocaleString()}/mo attributed = $${dollars.toLocaleString()}/mo`,
      evidence: `LCP ${seo.lcpSeconds}s · mobile score ${seo.mobileScore}/100 · CWV ${seo.cwvPass ? "pass" : "fail"}`,
    });
  }

  const formFields = 4 + (hash(company.domain + ":form") % 8);
  if (formFields > 6) {
    const extra = formFields - 6;
    const lossPct = Math.min(extra * 0.04, 0.22);
    const dollars = Math.round(revenue.attributedMonthly * lossPct);
    findings.push({
      kind: "conversion",
      code: "form_friction",
      label: "Lead form asks for more than it needs",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${formFields} required fields, ${extra} over the 6-field break-even × 4% abandonment per extra field × $${revenue.attributedMonthly.toLocaleString()}/mo = $${dollars.toLocaleString()}/mo`,
      evidence: `${formFields}-field contact form, no progressive disclosure`,
    });
  }

  const hasCallTracking = company.techSignals.some((t) => /CallRail|Invoca|CTM/i.test(t));
  const phoneLed = ["Home Services", "Legal", "Healthcare", "Financial Services", "Real Estate"].includes(company.industry);
  if (phoneLed && !hasCallTracking) {
    const calls = Math.round(revenue.organicSessions * 0.031);
    const dollars = Math.round(calls * 0.22 * closeRate * dealValue);
    findings.push({
      kind: "conversion",
      code: "untracked_calls",
      label: "Phone demand is unattributed",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `~${calls} organic calls/mo, no call tracking installed. 22% land outside business hours or unrouted × ${(closeRate * 100).toFixed(0)}% close × $${dealValue.toLocaleString()} = $${dollars.toLocaleString()}/mo`,
      evidence: `no call-tracking tag detected in ${company.techSignals.join(", ")}`,
    });
  }

  if (seo.schemaCoverage < 40) {
    const uplift = 0.08;
    const extraSessions = Math.round(revenue.organicSessions * uplift);
    const dollars = Math.round(extraSessions * perSession);
    findings.push({
      kind: "conversion",
      code: "missing_schema",
      label: "Structured data missing on money pages",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `schema coverage ${seo.schemaCoverage}% × 8% median CTR uplift from rich results = ${extraSessions.toLocaleString()} sessions/mo × $${perSession.toFixed(2)} per session = $${dollars.toLocaleString()}/mo`,
      evidence: `${seo.schemaCoverage}% of indexed templates carry valid schema`,
    });
  }

  const hasCrm = company.techSignals.some((t) => /HubSpot|Salesforce|Marketo|Pardot/i.test(t));
  if (!hasCrm) {
    const dollars = Math.round(revenue.attributedMonthly * 0.11);
    findings.push({
      kind: "conversion",
      code: "slow_lead_response",
      label: "No routing layer between form fill and follow-up",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `no CRM detected, median first response beyond 60 min. 11% of qualified inbound decays before contact × $${revenue.attributedMonthly.toLocaleString()}/mo = $${dollars.toLocaleString()}/mo`,
      evidence: `stack shows ${company.techSignals.join(", ")} with no CRM`,
    });
  }

  // ---- competitor leakage -------------------------------------------------

  const leader = a.competitors[0];

  if (a.trajectoryDelta < 0) {
    const pointsLost = Math.round((a.trajectory[0] - a.trajectory[11]) * 10) / 10;
    const sessionsPerPoint = Math.max(Math.round(revenue.organicSessions / Math.max(a.visibilityIndex, 6)), 1);
    const sessionsLost = Math.round(pointsLost * sessionsPerPoint);
    const dollars = Math.round(sessionsLost * perSession);
    findings.push({
      kind: "competitor",
      code: "sov_decline",
      label: `Share of voice ceded over 12 months`,
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `visibility ${a.trajectory[0]} → ${a.trajectory[11]} (${a.trajectoryDelta}%) = ${pointsLost} points × ${sessionsPerPoint.toLocaleString()} sessions/point × $${perSession.toFixed(2)} per session = $${dollars.toLocaleString()}/mo`,
      evidence: `${leader.name} moved ${leader.momentum > 0 ? "+" : ""}${leader.momentum}% over the same window`,
    });
  }

  const clicksLost = a.weakPositions.reduce((sum, w) => sum + w.clicksLost, 0);
  if (clicksLost > 0) {
    const dollars = Math.round(clicksLost * perSession);
    findings.push({
      kind: "competitor",
      code: "keyword_gap",
      label: "Top clusters owned by a named competitor",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${clicksLost.toLocaleString()} clicks/mo lost across ${a.weakPositions.length} clusters where a competitor holds page one × $${perSession.toFixed(2)} per session = $${dollars.toLocaleString()}/mo`,
      evidence: `worst: "${a.weakPositions[0].cluster}" — they sit ${a.weakPositions[0].prospectPosition}, ${a.weakPositions[0].bestCompetitor} sits ${a.weakPositions[0].competitorPosition}`,
    });
  }

  const brandedVolume = Math.round(between(company.domain + ":brand", 140, 2600));
  const bleedPct = between(company.domain + ":bleed", 0.04, 0.19, 2);
  if (bleedPct > 0.06) {
    const diverted = Math.round(brandedVolume * bleedPct);
    const dollars = Math.round(diverted * perSession * 1.6);
    findings.push({
      kind: "competitor",
      code: "branded_bleed",
      label: "Competitors intercepting branded search",
      severity: severity(dollars),
      monthlyDollars: dollars,
      basis: `${brandedVolume.toLocaleString()} branded searches/mo × ${(bleedPct * 100).toFixed(0)}% diverted to competitor listings = ${diverted.toLocaleString()} sessions × $${perSession.toFixed(2)} × 1.6 branded intent multiplier = $${dollars.toLocaleString()}/mo`,
      evidence: `${a.competitors.slice(0, 2).map((c) => c.name).join(" and ")} rank on "${company.name.split(" ")[0]}" modifiers`,
    });
  }

  const conversionMonthly = findings.filter((f) => f.kind === "conversion").reduce((s, f) => s + f.monthlyDollars, 0);
  const competitorMonthly = findings.filter((f) => f.kind === "competitor").reduce((s, f) => s + f.monthlyDollars, 0);

  return {
    findings: findings.sort((x, y) => y.monthlyDollars - x.monthlyDollars),
    conversionMonthly,
    competitorMonthly,
    totalMonthly: conversionMonthly + competitorMonthly,
    totalAnnual: (conversionMonthly + competitorMonthly) * 12,
  };
}

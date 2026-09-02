import { matchesIcp } from "./icp";
import type {
  Analysis,
  Company,
  Contact,
  IcpProfile,
  LeakageReport,
  ScoreComponent,
  ScoreResult,
  Tier,
} from "./types";

// The rubric. This file decides who gets contacted — no prompt, no model, no
// temperature. It is published verbatim at /rubric and /api/rubric so the
// client can audit or change the weights without touching the agent.

export const RUBRIC_VERSION = "1.0.0";

export const RUBRIC = {
  version: RUBRIC_VERSION,
  tiers: { A: 82, B: 70, C: 62 },
  components: [
    { pillar: "fit", code: "industry_match", label: "Industry inside ICP", weight: 12 },
    { pillar: "fit", code: "size_fit", label: "Headcount in target band", weight: 10 },
    { pillar: "fit", code: "region_fit", label: "Serviceable region", weight: 8 },
    { pillar: "pain", code: "leakage_magnitude", label: "Leakage as share of attributed revenue", weight: 18 },
    { pillar: "pain", code: "visibility_gap", label: "Visibility gap to category leader", weight: 10 },
    { pillar: "pain", code: "technical_debt", label: "Technical conversion debt", weight: 7 },
    { pillar: "timing", code: "trajectory_decline", label: "12-month ranking trajectory", weight: 10 },
    { pillar: "timing", code: "competitor_momentum", label: "Competitor momentum against them", weight: 6 },
    { pillar: "timing", code: "buying_signals", label: "Observed buying triggers", weight: 4 },
    { pillar: "reachability", code: "contact_confidence", label: "Decision-maker email confidence", weight: 8 },
    { pillar: "reachability", code: "stack_accessibility", label: "Stack indicates marketing maturity", weight: 4 },
    { pillar: "reachability", code: "crm_clear", label: "Not already an account in CRM", weight: 3 },
  ],
} as const;

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function scoreProspect(
  company: Company,
  analysis: Analysis,
  leakage: LeakageReport,
  contact: Contact,
  icp: IcpProfile,
  inCrm = false
): ScoreResult {
  const match = matchesIcp(company, icp);
  const leader = analysis.competitors[0];
  const components: ScoreComponent[] = [];

  const add = (code: string, raw: number, basis: string) => {
    const def = RUBRIC.components.find((c) => c.code === code)!;
    const bounded = clamp(raw);
    components.push({
      pillar: def.pillar as ScoreComponent["pillar"],
      code: def.code,
      label: def.label,
      weight: def.weight,
      raw: Math.round(bounded * 100) / 100,
      points: Math.round(bounded * def.weight * 10) / 10,
      basis,
    });
  };

  // fit
  add(
    "industry_match",
    icp.industries.includes(company.industry) ? 1 : 0,
    `${company.industry} ${icp.industries.includes(company.industry) ? "is" : "is not"} in ICP industries`
  );
  const mid = (icp.employeeMin + icp.employeeMax) / 2;
  const sizeRaw = match.ok ? 1 - Math.abs(company.employees - mid) / (icp.employeeMax - icp.employeeMin) : 0;
  add(
    "size_fit",
    sizeRaw,
    `${company.employees} staff against target band ${icp.employeeMin}-${icp.employeeMax} (midpoint ${mid})`
  );
  add(
    "region_fit",
    icp.regions.includes(company.region) ? 1 : 0.3,
    `${company.city}, ${company.region} ${icp.regions.includes(company.region) ? "inside" : "outside"} serviceable regions`
  );

  // pain
  const leakageShare = leakage.totalMonthly / Math.max(analysis.revenue.attributedMonthly, 1);
  add(
    "leakage_magnitude",
    leakageShare / 0.6,
    `$${leakage.totalMonthly.toLocaleString()}/mo leakage ÷ $${analysis.revenue.attributedMonthly.toLocaleString()}/mo attributed = ${(leakageShare * 100).toFixed(0)}% of organic revenue, normalised against a 60% ceiling`
  );
  const gap = (leader.visibility - analysis.visibilityIndex) / Math.max(leader.visibility, 1);
  add(
    "visibility_gap",
    gap,
    `visibility ${analysis.visibilityIndex} vs ${leader.name} ${leader.visibility} = ${(gap * 100).toFixed(0)}% behind the leader`
  );
  const debt =
    (analysis.seo.lcpSeconds > 2.5 ? 0.4 : 0) +
    (analysis.seo.schemaCoverage < 40 ? 0.3 : 0) +
    (analysis.seo.mobileScore < 60 ? 0.3 : 0);
  add(
    "technical_debt",
    debt,
    `LCP ${analysis.seo.lcpSeconds}s, schema ${analysis.seo.schemaCoverage}%, mobile ${analysis.seo.mobileScore}/100`
  );

  // timing
  add(
    "trajectory_decline",
    analysis.trajectoryDelta < 0 ? Math.abs(analysis.trajectoryDelta) / 40 : 0,
    `12-month visibility trajectory ${analysis.trajectoryDelta > 0 ? "+" : ""}${analysis.trajectoryDelta}%, normalised against a −40% floor`
  );
  add(
    "competitor_momentum",
    leader.momentum > 0 ? leader.momentum / 25 : 0,
    `${leader.name} momentum ${leader.momentum > 0 ? "+" : ""}${leader.momentum}% while prospect sits at ${analysis.trajectoryDelta}%`
  );
  add(
    "buying_signals",
    Math.min(company.signals.length / 2, 1),
    `observed: ${company.signals.join("; ")}`
  );

  // reachability
  add(
    "contact_confidence",
    contact.emailConfidence,
    `${contact.name}, ${contact.title} — pattern confidence ${(contact.emailConfidence * 100).toFixed(0)}%`
  );
  add(
    "stack_accessibility",
    company.techSignals.length >= 3 ? 1 : company.techSignals.length / 3,
    `stack: ${company.techSignals.join(", ")}`
  );
  add("crm_clear", inCrm ? 0 : 1, inCrm ? "already an account in CRM — suppressed" : "no existing CRM record on this domain");

  const score = Math.round(components.reduce((s, c) => s + c.points, 0) * 10) / 10;
  const pillars: Record<string, number> = {};
  for (const c of components) pillars[c.pillar] = Math.round(((pillars[c.pillar] ?? 0) + c.points) * 10) / 10;

  const tier: Tier =
    score >= RUBRIC.tiers.A ? "A" : score >= RUBRIC.tiers.B ? "B" : score >= RUBRIC.tiers.C ? "C" : "D";

  return {
    score,
    tier,
    components,
    pillars,
    qualified: score >= icp.minScore && match.ok,
    rubricVersion: RUBRIC_VERSION,
  };
}

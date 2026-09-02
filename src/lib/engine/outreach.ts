import { extractJson, generate } from "../ai";
import type { Analysis, Company, Contact, LeakageReport, Sequence, Touch } from "./types";

// Copy generation. The model writes sentences; it is never allowed to write a
// number. Every figure is injected from the fact sheet, and generated copy is
// validated against that sheet before it is accepted — any dollar figure that
// is not in the sheet fails the touch back to the deterministic version.

export function buildFactSheet(
  company: Company,
  a: Analysis,
  leakage: LeakageReport,
  contact: Contact
): Record<string, string> {
  const top = leakage.findings[0];
  const worst = a.weakPositions[0];
  const leader = a.competitors[0];
  return {
    contact_first_name: contact.name.split(" ")[0],
    company: company.name,
    city: company.city,
    subvertical: company.subvertical,
    total_leakage_monthly: `$${leakage.totalMonthly.toLocaleString()}`,
    total_leakage_annual: `$${leakage.totalAnnual.toLocaleString()}`,
    conversion_leakage_monthly: `$${leakage.conversionMonthly.toLocaleString()}`,
    competitor_leakage_monthly: `$${leakage.competitorMonthly.toLocaleString()}`,
    top_finding: top ? top.label : "no material leakage detected",
    top_finding_dollars: top ? `$${top.monthlyDollars.toLocaleString()}` : "$0",
    top_finding_basis: top ? top.basis : "",
    leader_name: leader.name,
    leader_visibility: String(leader.visibility),
    prospect_visibility: String(a.visibilityIndex),
    trajectory_delta: `${a.trajectoryDelta}%`,
    worst_cluster: worst.cluster,
    worst_position: String(worst.prospectPosition),
    competitor_position: String(worst.competitorPosition),
    clicks_lost: worst.clicksLost.toLocaleString(),
    lcp: `${a.seo.lcpSeconds}s`,
    attributed_monthly: `$${a.revenue.attributedMonthly.toLocaleString()}`,
    revenue_gap_monthly: `$${a.revenue.gapMonthly.toLocaleString()}`,
    signals: company.signals.join("; "),
  };
}

function pickAngle(leakage: LeakageReport, a: Analysis): { angle: string; strategy: string } {
  const top = leakage.findings[0];
  if (!top) {
    return {
      angle: "benchmark",
      strategy: "No material leakage detected. Lead with a category benchmark rather than a problem claim, and keep the ask low-commitment.",
    };
  }
  if (top.kind === "competitor") {
    return {
      angle: "named-competitor",
      strategy: `Lead with ${a.competitors[0].name} taking specific ground, not with a service pitch. The opener names one cluster and two positions, because a rival's name is the only claim an owner cannot skim past. Follow-ups widen from one keyword to the full gap, then to the revenue number.`,
    };
  }
  return {
    angle: "conversion-leak",
    strategy: `Lead with demand they already paid for and lost — ${top.label.toLowerCase()} — because that reframes the conversation from "buy more traffic" to "keep what you have". Follow-ups add the competitor gap as escalation, then close on the prepared analysis.`,
  };
}

function deterministicTouches(f: Record<string, string>, angle: string): Touch[] {
  const first = f.contact_first_name;
  const competitorLine =
    angle === "named-competitor"
      ? `${f.leader_name} is sitting at position ${f.competitor_position} for "${f.worst_cluster}". You're at ${f.worst_position}. That single cluster is ${f.clicks_lost} clicks a month going to them instead of you.`
      : `Your site takes ${f.lcp} to render its main content, and your lead form asks for more than it needs. That combination is where ${f.conversion_leakage_monthly} a month goes.`;

  return [
    {
      day: 0,
      channel: "email",
      subject: `${f.company} vs ${f.leader_name} — one cluster`,
      body: `${first},\n\n${competitorLine}\n\nI ran the full picture for ${f.company} this morning: organic visibility, the four competitors above you, and where demand leaks between the search and the booked job. Total came to ${f.total_leakage_monthly} a month.\n\nI can walk you through the arithmetic on a 20-minute call. If the numbers don't hold up, you've lost twenty minutes and kept the analysis.\n\nShakil`,
      factsUsed: ["worst_cluster", "competitor_position", "worst_position", "clicks_lost", "total_leakage_monthly"],
    },
    {
      day: 3,
      channel: "linkedin",
      subject: "Connection note",
      body: `${first} — sent you a note on the ${f.subvertical.toLowerCase()} search picture in ${f.city}. Short version: ${f.leader_name} has pulled ahead on visibility (${f.leader_visibility} to your ${f.prospect_visibility}) and it's concentrated in a handful of clusters. Happy to send the breakdown either way.`,
      factsUsed: ["leader_name", "leader_visibility", "prospect_visibility", "city"],
    },
    {
      day: 5,
      channel: "email",
      subject: `the ${f.trajectory_delta} number`,
      body: `${first},\n\nFollowing up with the specific one.\n\nYour organic visibility moved ${f.trajectory_delta} over twelve months while ${f.leader_name} moved the other way. On your own traffic and close rate that gap is ${f.revenue_gap_monthly} a month in attributable revenue.\n\nThe fix isn't more content. It's three clusters where you're on page two and they're on page one, plus the conversion leak on the way in.\n\nWorth twenty minutes?\n\nShakil`,
      factsUsed: ["trajectory_delta", "leader_name", "revenue_gap_monthly"],
    },
    {
      day: 10,
      channel: "email",
      subject: `analysis for ${f.company} — yours either way`,
      body: `${first},\n\nI've had the ${f.company} analysis sitting in a folder for a week. Rather than keep pitching it, here's what's in it:\n\n· the four competitors ranking above you, with their visibility scores\n· five clusters where you're losing clicks, with monthly volume and current positions\n· ${f.top_finding} — ${f.top_finding_dollars} a month, with the arithmetic shown\n· the total: ${f.total_leakage_monthly} a month, ${f.total_leakage_annual} a year\n\nSay the word and I'll send it over, no call required. If you'd rather I walk you through it, that's twenty minutes.\n\nShakil`,
      factsUsed: ["top_finding", "top_finding_dollars", "total_leakage_monthly", "total_leakage_annual"],
    },
    {
      day: 17,
      channel: "email",
      subject: "closing the loop",
      body: `${first},\n\nLast one from me — I'll assume the timing is wrong rather than keep landing in your inbox.\n\nIf ${f.signals.split(";")[0].trim()} changes the picture in a quarter or two, the analysis will still be here and I'll refresh it for free.\n\nShakil`,
      factsUsed: ["signals"],
    },
  ];
}

const MONEY = /\$[\d][\d,\.]*/g;

function validate(touches: Touch[], facts: Record<string, string>): boolean {
  const allowed = new Set(Object.values(facts).flatMap((v) => v.match(MONEY) ?? []));
  for (const t of touches) {
    for (const found of `${t.subject} ${t.body}`.match(MONEY) ?? []) {
      if (!allowed.has(found)) return false;
    }
  }
  return true;
}

export async function generateSequence(
  company: Company,
  a: Analysis,
  leakage: LeakageReport,
  contact: Contact,
  useAi = true
): Promise<Sequence> {
  const factSheet = buildFactSheet(company, a, leakage, contact);
  const { angle, strategy } = pickAngle(leakage, a);
  const fallback: Sequence = {
    strategy,
    angle,
    touches: deterministicTouches(factSheet, angle),
    generatedBy: "deterministic",
    factSheet,
  };

  if (!useAi) return fallback;

  const prompt = `You write outbound email for a digital marketing agency. Write a 5-touch sequence for one prospect.

FACT SHEET (the only facts you may use — never invent a number, never round one):
${Object.entries(factSheet).map(([k, v]) => `${k}: ${v}`).join("\n")}

STRATEGY: ${strategy}

Rules:
- Every dollar figure and every position number must be copied exactly from the fact sheet. If a number is not in the sheet, do not write it.
- Plain, direct, lowercase-ish subject lines. No "I hope this finds you well", no "Quick question", no exclamation marks.
- Touch 1 (day 0, email): one specific competitor or leak fact, then the ask.
- Touch 2 (day 3, linkedin): two sentences maximum, connection note.
- Touch 3 (day 5, email): the trajectory and revenue gap.
- Touch 4 (day 10, email): give the analysis away, bulleted contents.
- Touch 5 (day 17, email): breakup, no guilt, leave the door open.
- Sign every email "Shakil".

Return JSON only:
{"touches":[{"day":0,"channel":"email","subject":"...","body":"...","factsUsed":["key"]}]}`;

  const result = await generate(prompt, 3000);
  if (!result) return fallback;

  const parsed = extractJson<{ touches: Touch[] }>(result.text);
  if (!parsed?.touches || parsed.touches.length < 3) return fallback;
  if (!validate(parsed.touches, factSheet)) return fallback;

  return {
    strategy,
    angle,
    touches: parsed.touches.map((t, i) => ({
      day: t.day ?? [0, 3, 5, 10, 17][i] ?? i * 4,
      channel: t.channel ?? "email",
      subject: t.subject ?? "",
      body: t.body ?? "",
      factsUsed: t.factsUsed ?? [],
    })),
    generatedBy: "gemini",
    factSheet,
  };
}

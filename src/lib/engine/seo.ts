import { between, hash, rng } from "./rand";
import { ENGINE_VERSION } from "./types";
import type { Analysis, Company, Competitor, WeakPosition } from "./types";

// Competitive visibility model. Deterministic in the demo data plane; in phase 1
// the three inputs below (visibility, trajectory, competitor set) come from a
// live SERP provider and PageSpeed, and nothing downstream changes shape.

const COMPETITOR_STEMS = [
  "Meridian", "Ironclad", "Summit", "Blackwood", "Crestline", "Pinnacle",
  "Redstone", "Clearwater", "Fortis", "Alderman", "Granite", "Vantage",
  "Copperline", "Silverbrook", "Highgate", "Foxglove",
];

const COMPETITOR_SUFFIX: Record<string, string[]> = {
  "Home Services": ["Home Services", "Mechanical", "Contracting"],
  Healthcare: ["Health Group", "Clinics", "Care Partners"],
  Legal: ["Law Group", "LLP", "Legal"],
  Manufacturing: ["Industries", "Manufacturing", "Works"],
  Logistics: ["Logistics", "Transport Group", "Supply Co"],
  "B2B SaaS": ["Systems", "Labs", "Cloud"],
  Ecommerce: ["Collective", "Goods Co", "Supply"],
  "Real Estate": ["Property Group", "Realty", "Partners"],
  "Financial Services": ["Capital", "Advisors", "Financial"],
  Education: ["Academy", "Institute", "Learning"],
  Hospitality: ["Group", "Hospitality", "Collection"],
};

const CLUSTERS: Record<string, string[]> = {
  "Home Services": ["emergency {city} repair", "{sub} installation cost", "best {sub} near me", "{sub} maintenance plan", "commercial {sub} {city}"],
  Healthcare: ["{sub} {city}", "cost of {sub} treatment", "book {sub} consultation", "{sub} financing options", "best {sub} clinic reviews"],
  Legal: ["{sub} lawyer {city}", "free {sub} consultation", "how much is my {sub} claim worth", "no win no fee {sub}", "{sub} attorney near me"],
  Manufacturing: ["custom {sub} supplier", "{sub} manufacturer canada", "industrial {sub} quote", "{sub} rfq", "bulk {sub} pricing"],
  Logistics: ["{sub} services {city}", "freight quote {city}", "warehousing and distribution", "cross border shipping", "same day {sub}"],
  "B2B SaaS": ["{sub} software", "best {sub} platform", "{sub} pricing comparison", "{sub} alternatives", "{sub} for enterprise"],
  Ecommerce: ["buy {sub} online", "best {sub} brands", "{sub} reviews", "{sub} gift guide", "affordable {sub}"],
  "Real Estate": ["{sub} {city}", "commercial space for lease {city}", "property management fees", "{sub} companies near me", "office space {city}"],
  "Financial Services": ["{sub} advisor {city}", "best {sub} rates", "{sub} calculator", "{sub} for business owners", "compare {sub} providers"],
  Education: ["{sub} programs {city}", "{sub} tuition cost", "best {sub} school", "{sub} admissions", "{sub} scholarships"],
  Hospitality: ["{sub} {city}", "best {sub} near me", "{sub} membership cost", "book {sub} online", "{sub} deals"],
};

function competitorsFor(company: Company): Competitor[] {
  const suffixes = COMPETITOR_SUFFIX[company.industry] ?? ["Group", "Partners", "Co"];
  const r = rng(company.domain + ":competitors");
  const used = new Set<string>();
  const out: Competitor[] = [];
  const count = 3 + (hash(company.domain) % 2);
  for (let i = 0; out.length < count && i < 40; i++) {
    const stem = COMPETITOR_STEMS[Math.floor(r() * COMPETITOR_STEMS.length)];
    if (used.has(stem)) continue;
    used.add(stem);
    const suffix = suffixes[out.length % suffixes.length];
    const name = `${stem} ${suffix}`;
    out.push({
      name,
      domain: `${stem.toLowerCase()}${suffix.split(" ")[0].toLowerCase()}.example`,
      visibility: Math.round(38 + r() * 52),
      momentum: Math.round((r() * 34 - 6) * 10) / 10,
      sharedKeywords: Math.round(120 + r() * 900),
    });
  }
  return out.sort((a, b) => b.visibility - a.visibility);
}

function weakPositionsFor(company: Company, competitors: Competitor[]): WeakPosition[] {
  const templates = CLUSTERS[company.industry] ?? CLUSTERS["B2B SaaS"];
  const sub = company.subvertical.toLowerCase();
  const city = company.city.toLowerCase();
  return templates.slice(0, 5).map((tpl, i) => {
    const cluster = tpl.replace("{sub}", sub).replace("{city}", city);
    const seed = `${company.domain}:kw:${i}`;
    const volume = Math.round(between(seed + ":v", 220, 6400) / 10) * 10;
    const prospectPosition = Math.round(between(seed + ":p", 9, 48));
    const competitor = competitors[i % competitors.length];
    const competitorPosition = Math.round(between(seed + ":c", 1, 5));
    // Click-through by position, industry-standard organic CTR curve.
    const ctrAt = (pos: number) =>
      pos <= 1 ? 0.274 : pos <= 3 ? 0.151 : pos <= 5 ? 0.092 : pos <= 10 ? 0.041 : pos <= 20 ? 0.011 : 0.003;
    const clicksLost = Math.round(volume * (ctrAt(competitorPosition) - ctrAt(prospectPosition)));
    return {
      cluster,
      volume,
      prospectPosition,
      bestCompetitor: competitor.name,
      competitorPosition,
      clicksLost: Math.max(clicksLost, 0),
      basis: `${volume.toLocaleString()} searches/mo × (CTR@${competitorPosition} ${(ctrAt(competitorPosition) * 100).toFixed(1)}% − CTR@${prospectPosition} ${(ctrAt(prospectPosition) * 100).toFixed(1)}%) = ${Math.max(clicksLost, 0)} clicks/mo`,
    };
  });
}

export function analyzeCompany(company: Company): Analysis {
  const competitors = competitorsFor(company);
  const visibilityIndex = Math.round(between(company.domain + ":vis", 14, 58));
  const declining = hash(company.domain + ":dir") % 100 < 72;

  const trajectory: number[] = [];
  const start = visibilityIndex + (declining ? Math.round(between(company.domain + ":drop", 6, 22)) : -6);
  for (let m = 0; m < 12; m++) {
    const noise = between(`${company.domain}:t:${m}`, -2.5, 2.5, 1);
    const progress = m / 11;
    trajectory.push(Math.max(3, Math.round((start + (visibilityIndex - start) * progress + noise) * 10) / 10));
  }
  const trajectoryDelta = Math.round(((trajectory[11] - trajectory[0]) / trajectory[0]) * 1000) / 10;

  const weakPositions = weakPositionsFor(company, competitors);

  const seo = {
    lcpSeconds: between(company.domain + ":lcp", 1.6, 6.4, 1),
    indexedPages: Math.round(between(company.domain + ":idx", 24, 1800)),
    referringDomains: Math.round(between(company.domain + ":rd", 30, 900)),
    schemaCoverage: Math.round(between(company.domain + ":schema", 0, 82)),
    cwvPass: hash(company.domain + ":cwv") % 100 < 34,
    mobileScore: Math.round(between(company.domain + ":mob", 28, 88)),
  };

  const organicSessions = Math.round(
    (visibilityIndex * 140 + company.employees * 22) * (1 + between(company.domain + ":sess", -0.2, 0.35, 2))
  );
  const conversionRate = between(company.domain + ":cvr", 0.9, 3.4, 2);
  const avgDealValue = Math.round(
    between(company.domain + ":deal", company.industry === "B2B SaaS" ? 4200 : 900, company.industry === "B2B SaaS" ? 26000 : 7400) / 50
  ) * 50;
  const attributedMonthly = Math.round((organicSessions * (conversionRate / 100) * avgDealValue) / 100) * 100;
  const leader = competitors[0];
  const competitorAttributedMonthly = Math.round(
    (attributedMonthly * (leader.visibility / Math.max(visibilityIndex, 6))) / 100
  ) * 100;

  return {
    domain: company.domain,
    visibilityIndex,
    trajectory,
    trajectoryDelta,
    competitors,
    weakPositions,
    seo,
    revenue: {
      organicSessions,
      conversionRate,
      avgDealValue,
      attributedMonthly,
      competitorAttributedMonthly,
      gapMonthly: competitorAttributedMonthly - attributedMonthly,
      basis: `${organicSessions.toLocaleString()} organic sessions/mo × ${conversionRate}% CVR × $${avgDealValue.toLocaleString()} avg deal = $${attributedMonthly.toLocaleString()}/mo attributed`,
    },
    engineVersion: ENGINE_VERSION,
  };
}

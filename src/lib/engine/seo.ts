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

// Revenue-band midpoints, annual. The sourcing plane reports bands, not exact
// revenue, so the midpoint is the honest anchor.
const BAND_MID: Record<string, number> = {
  "$1-2M": 1_500_000,
  "$2-5M": 3_500_000,
  "$5-10M": 7_500_000,
  "$10-25M": 17_500_000,
  "$25-50M": 37_500_000,
  "$50-100M": 75_000_000,
  "$100M+": 150_000_000,
};

// Share of revenue that organic search plausibly touches, by vertical.
const ORGANIC_SHARE: Record<string, number> = {
  "Home Services": 0.18,
  Healthcare: 0.15,
  Legal: 0.22,
  "B2B SaaS": 0.11,
  Ecommerce: 0.27,
  Manufacturing: 0.06,
  Logistics: 0.07,
  "Real Estate": 0.13,
  "Financial Services": 0.11,
  Education: 0.16,
  Hospitality: 0.19,
};

// Visitor-to-lead rate. Considered purchases convert far lower than the
// blended averages people quote.
const CVR: Record<string, [number, number]> = {
  "B2B SaaS": [0.6, 1.8],
  Manufacturing: [0.5, 1.6],
  Logistics: [0.7, 2.0],
  Ecommerce: [1.1, 3.0],
  Legal: [1.6, 3.8],
  "Home Services": [1.8, 4.2],
};

// Lead-to-customer rate. Ecommerce is transactional, so the lead is the sale.
const CLOSE_RATE: Record<string, number> = {
  "B2B SaaS": 0.16,
  Manufacturing: 0.19,
  Logistics: 0.22,
  Ecommerce: 1,
  Legal: 0.28,
  Healthcare: 0.34,
  "Home Services": 0.35,
  "Financial Services": 0.24,
  "Real Estate": 0.21,
  Education: 0.26,
  Hospitality: 0.4,
};

const DEAL: Record<string, [number, number]> = {
  "B2B SaaS": [9000, 26000],
  Manufacturing: [6000, 40000],
  Logistics: [4000, 22000],
  Legal: [2500, 12000],
  Healthcare: [900, 6500],
  "Home Services": [1200, 7400],
  Ecommerce: [80, 320],
  "Real Estate": [3000, 18000],
  "Financial Services": [2000, 14000],
  Education: [4000, 18000],
  Hospitality: [200, 1400],
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

  // Attribution is anchored to the company's revenue band rather than built up
  // from an invented session count. Multiplying sessions × CVR × deal value in
  // the other direction produces figures larger than the company itself, which
  // is exactly the kind of number that loses a call in the first 30 seconds.
  const monthlyRevenue = (BAND_MID[company.revenueBand] ?? 8_000_000) / 12;
  const organicShare =
    (ORGANIC_SHARE[company.industry] ?? 0.14) * between(company.domain + ":share", 0.75, 1.25, 2);
  const attributedMonthly = Math.round((monthlyRevenue * organicShare) / 100) * 100;

  const [cvrMin, cvrMax] = CVR[company.industry] ?? [1.2, 3.2];
  const conversionRate = between(company.domain + ":cvr", cvrMin, cvrMax, 2);
  const closeRate = CLOSE_RATE[company.industry] ?? 0.3;
  const [dealMin, dealMax] = DEAL[company.industry] ?? [1200, 9000];
  const avgDealValue = Math.round(between(company.domain + ":deal", dealMin, dealMax) / 50) * 50;

  // One visit is worth lead rate × close rate × deal value. Sessions are then
  // derived so the published arithmetic reconciles to the attributed figure.
  const revenuePerSession = (conversionRate / 100) * closeRate * avgDealValue;
  const organicSessions = Math.round(attributedMonthly / Math.max(revenuePerSession, 1));

  const leader = competitors[0];
  const competitorAttributedMonthly =
    Math.round(
      (attributedMonthly * Math.min(leader.visibility / Math.max(visibilityIndex, 6), 2.6)) / 100
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
      closeRate,
      avgDealValue,
      revenuePerSession: Math.round(revenuePerSession * 100) / 100,
      organicShare: Math.round(organicShare * 1000) / 10,
      attributedMonthly,
      competitorAttributedMonthly,
      gapMonthly: competitorAttributedMonthly - attributedMonthly,
      basis: `${organicSessions.toLocaleString()} organic sessions/mo × ${conversionRate}% lead rate × ${(closeRate * 100).toFixed(0)}% close × $${avgDealValue.toLocaleString()} avg deal = $${attributedMonthly.toLocaleString()}/mo, which is ${(organicShare * 100).toFixed(0)}% of ${company.revenueBand} revenue`,
    },
    engineVersion: ENGINE_VERSION,
  };
}

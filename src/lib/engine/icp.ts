import type { Company, IcpProfile } from "./types";

export const DEFAULT_ICP: IcpProfile = {
  name: "Mid-market services, organic-dependent, under competitive pressure",
  industries: ["Home Services", "Healthcare", "Legal", "Financial Services", "B2B SaaS"],
  employeeMin: 20,
  employeeMax: 400,
  regions: ["QC", "ON", "MA", "IL", "FL"],
  exclusions: ["existing client", "agency", "franchise HQ under 10 staff"],
  persona: {
    titles: ["Owner / Managing Partner", "VP Marketing", "Head of Growth", "Marketing Manager"],
    pains: [
      "organic traffic flat or falling while a named competitor climbs",
      "spend rising, attributable pipeline is not",
      "no line of sight from ranking position to revenue",
    ],
    triggers: [
      "hiring a marketing role",
      "competitor increased spend or share of voice",
      "site redesign or rebrand in the last two quarters",
      "funding, acquisition or multi-location expansion",
    ],
  },
  minScore: 62,
};

export function matchesIcp(company: Company, icp: IcpProfile): { ok: boolean; reason: string } {
  if (!icp.industries.includes(company.industry)) {
    return { ok: false, reason: `industry ${company.industry} not in ICP` };
  }
  if (company.employees < icp.employeeMin || company.employees > icp.employeeMax) {
    return {
      ok: false,
      reason: `headcount ${company.employees} outside ${icp.employeeMin}-${icp.employeeMax}`,
    };
  }
  if (icp.regions.length && !icp.regions.includes(company.region)) {
    return { ok: false, reason: `region ${company.region} not in ICP` };
  }
  return { ok: true, reason: `industry, headcount and region all inside ICP` };
}

const FIRST = ["Marc", "Sophie", "Daniel", "Claire", "Andre", "Nadia", "Peter", "Elise", "Jonathan", "Maya", "Luc", "Rachel"];
const LAST = ["Tremblay", "Gagnon", "Lavoie", "Roy", "Bergeron", "Whitfield", "Osei", "Kaplan", "Marchand", "Nguyen", "Doyle", "Fortin"];

export function inferContact(company: Company, icp: IcpProfile) {
  const seed = company.domain;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const first = FIRST[h % FIRST.length];
  const last = LAST[(h >> 4) % LAST.length];
  const title = company.employees > 150 ? icp.persona.titles[1] : icp.persona.titles[0];
  const confidence = company.techSignals.some((t) => /HubSpot|Salesforce|Marketo|Pardot/.test(t))
    ? 0.93
    : 0.78;
  return {
    name: `${first} ${last}`,
    title,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.domain}`,
    emailConfidence: confidence,
    linkedin: `linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
  };
}

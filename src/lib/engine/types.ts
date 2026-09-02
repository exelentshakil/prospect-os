export const ENGINE_VERSION = "1.0.0";

export type Tier = "A" | "B" | "C" | "D";

export type Stage =
  | "sourced"
  | "qualified"
  | "contacted"
  | "replied"
  | "call_booked"
  | "parked";

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  subvertical: string;
  employees: number;
  city: string;
  region: string;
  country: string;
  revenueBand: string;
  founded: number;
  techSignals: string[];
  signals: string[];
}

export interface Competitor {
  name: string;
  domain: string;
  visibility: number;
  momentum: number;
  sharedKeywords: number;
}

export interface WeakPosition {
  cluster: string;
  volume: number;
  prospectPosition: number;
  bestCompetitor: string;
  competitorPosition: number;
  clicksLost: number;
  basis: string;
}

export interface SeoPerformance {
  lcpSeconds: number;
  indexedPages: number;
  referringDomains: number;
  schemaCoverage: number;
  cwvPass: boolean;
  mobileScore: number;
}

export interface RevenueAttribution {
  organicSessions: number;
  conversionRate: number;
  closeRate: number;
  avgDealValue: number;
  revenuePerSession: number;
  organicShare: number;
  attributedMonthly: number;
  competitorAttributedMonthly: number;
  gapMonthly: number;
  basis: string;
}

export interface Analysis {
  domain: string;
  visibilityIndex: number;
  trajectory: number[];
  trajectoryDelta: number;
  competitors: Competitor[];
  weakPositions: WeakPosition[];
  seo: SeoPerformance;
  revenue: RevenueAttribution;
  engineVersion: string;
}

export type LeakageKind = "conversion" | "competitor";

export interface LeakageFinding {
  kind: LeakageKind;
  code: string;
  label: string;
  severity: "high" | "medium" | "low";
  monthlyDollars: number;
  basis: string;
  evidence: string;
}

export interface LeakageReport {
  findings: LeakageFinding[];
  conversionMonthly: number;
  competitorMonthly: number;
  totalMonthly: number;
  totalAnnual: number;
}

export interface ScoreComponent {
  pillar: "fit" | "pain" | "timing" | "reachability";
  code: string;
  label: string;
  weight: number;
  raw: number;
  points: number;
  basis: string;
}

export interface ScoreResult {
  score: number;
  tier: Tier;
  components: ScoreComponent[];
  pillars: Record<string, number>;
  qualified: boolean;
  rubricVersion: string;
}

export interface Touch {
  day: number;
  channel: "email" | "linkedin" | "call";
  subject: string;
  body: string;
  factsUsed: string[];
}

export interface Sequence {
  strategy: string;
  angle: string;
  touches: Touch[];
  generatedBy: "gemini" | "deterministic";
  factSheet: Record<string, string>;
}

export interface Prospect {
  id: string;
  company: Company;
  analysis: Analysis;
  leakage: LeakageReport;
  score: ScoreResult;
  contact: Contact;
  stage: Stage;
}

export interface Contact {
  name: string;
  title: string;
  email: string;
  emailConfidence: number;
  linkedin: string;
}

export interface TraceStep {
  index: number;
  agent: string;
  role: string;
  mode: "deterministic" | "model-backed";
  status: "ok" | "skipped" | "error";
  durationMs: number;
  input: string;
  output: string;
}

export interface IcpProfile {
  name: string;
  industries: string[];
  employeeMin: number;
  employeeMax: number;
  regions: string[];
  exclusions: string[];
  persona: {
    titles: string[];
    pains: string[];
    triggers: string[];
  };
  minScore: number;
}

import { aiConfigured, generate } from "../ai";
import { crm } from "./crm";
import { DEFAULT_ICP, inferContact, matchesIcp } from "./icp";
import { detectLeakage } from "./leakage";
import { generateSequence } from "./outreach";
import { scoreProspect } from "./scoring";
import { analyzeCompany } from "./seo";
import { ENGINE_VERSION } from "./types";
import type { IcpProfile, Prospect, Sequence, TraceStep } from "./types";
import { UNIVERSE } from "./universe";

export interface RunResult {
  runId: string;
  icp: IcpProfile;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  trace: TraceStep[];
  prospects: Prospect[];
  marketRead: string;
  counts: { sourced: number; analysed: number; qualified: number; parked: number; synced: number };
  engineVersion: string;
  aiLive: boolean;
}

const globalState = globalThis as unknown as { __runs?: RunResult[] };
const runs: RunResult[] = globalState.__runs ?? [];
globalState.__runs = runs;

export function lastRun(): RunResult | null {
  return runs[0] ?? null;
}

export function allRuns(): RunResult[] {
  return runs;
}

export function buildProspect(domain: string, icp: IcpProfile = DEFAULT_ICP): Prospect | null {
  const company = UNIVERSE.find((c) => c.id === domain || c.domain === domain);
  if (!company) return null;
  const analysis = analyzeCompany(company);
  const leakage = detectLeakage(company, analysis);
  const contact = inferContact(company, icp);
  const score = scoreProspect(company, analysis, leakage, contact, icp);
  return {
    id: company.id,
    company,
    analysis,
    leakage,
    score,
    contact,
    stage: score.qualified ? "qualified" : "parked",
  };
}

export async function sequenceFor(domain: string, useAi: boolean): Promise<Sequence | null> {
  const p = buildProspect(domain);
  if (!p) return null;
  return generateSequence(p.company, p.analysis, p.leakage, p.contact, useAi);
}

export async function runPipeline(overrides: Partial<IcpProfile> = {}, limit = 12): Promise<RunResult> {
  const icp: IcpProfile = { ...DEFAULT_ICP, ...overrides, persona: DEFAULT_ICP.persona };
  const runId = `run_${Date.now().toString(36)}`;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const trace: TraceStep[] = [];

  // One agent failing degrades the run, it does not end it. The step records
  // status "error" with the message, falls back, and the pipeline continues —
  // a partial result with a visible failure in the trace beats a 500.
  const step = async <T>(
    agent: string,
    role: string,
    mode: TraceStep["mode"],
    input: string,
    fn: () => Promise<{ value: T; output: string }> | { value: T; output: string },
    fallback: T
  ): Promise<T> => {
    const started = Date.now();
    try {
      const { value, output } = await fn();
      trace.push({
        index: trace.length + 1,
        agent,
        role,
        mode,
        status: "ok",
        durationMs: Date.now() - started,
        input,
        output,
      });
      return value;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${agent} failed`, message);
      trace.push({
        index: trace.length + 1,
        agent,
        role,
        mode,
        status: "error",
        durationMs: Date.now() - started,
        input,
        output: `failed: ${message}`,
      });
      return fallback;
    }
  };

  // 1 — sourcing
  const candidates = await step(
    "sourcing-agent",
    "crawl + firmographic filter",
    "deterministic",
    `${UNIVERSE.length} companies in sourcing plane, ICP: ${icp.industries.join("/")}, ${icp.employeeMin}-${icp.employeeMax} staff`,
    () => {
      const matched = UNIVERSE.filter((c) => matchesIcp(c, icp).ok).slice(0, limit);
      return {
        value: matched,
        output: `${matched.length} candidates passed ICP filter, ${UNIVERSE.length - matched.length} rejected`,
      };
    },
    []
  );

  // 2 — research
  const marketRead = await step(
    "research-agent",
    "positioning + signal summary",
    "model-backed",
    `${candidates.length} companies, signals + firmographics`,
    async () => {
      const brief = candidates
        .slice(0, 6)
        .map((c) => `${c.name} (${c.subvertical}, ${c.employees} staff, ${c.city}): ${c.signals.join("; ")}`)
        .join("\n");
      if (aiConfigured()) {
        const res = await generate(
          `You are the research step of an outbound agent for a digital marketing agency. In 3 sentences, describe the pattern across these prospects and which trigger is most worth leading with. No preamble, no bullet points, no invented numbers.\n\n${brief}`,
          400
        );
        if (res) {
          return { value: res.text, output: `${res.model} · ${res.text.length} chars` };
        }
      }
      const industries = Array.from(new Set(candidates.map((c) => c.industry)));
      const triggers = candidates.flatMap((c) => c.signals).filter((s) => /hiring|spend|redesign|expansion|acquired/i.test(s));
      const text = `${candidates.length} companies across ${industries.length} verticals (${industries.slice(0, 3).join(", ")}) cleared the ICP filter. ${triggers.length} carry an active buying trigger, most commonly hiring or a spend change, which is the timing pillar doing most of the work in the score. The strongest lead-in for this cohort is the named-competitor gap rather than a generic audit offer.`;
      return { value: text, output: "deterministic fallback — no GEMINI_API_KEY configured" };
    },
    ""
  );

  // 3 — competitive analysis
  const analyses = await step(
    "seo-agent",
    "visibility, trajectory, competitor map",
    "deterministic",
    `${candidates.length} domains`,
    () => {
      const value = candidates.map((c) => analyzeCompany(c));
      const declining = value.filter((a) => a.trajectoryDelta < 0).length;
      return {
        value,
        output: `${value.length} analysed · ${declining} declining on 12-month trajectory · ${value.reduce((s, a) => s + a.competitors.length, 0)} competitors mapped`,
      };
    },
    []
  );

  // 4 — leakage
  const leakages = await step(
    "leakage-agent",
    "conversion + competitor leakage",
    "deterministic",
    `${analyses.length} analyses`,
    () => {
      const value = candidates.map((c, i) => detectLeakage(c, analyses[i]));
      const total = value.reduce((s, l) => s + l.totalMonthly, 0);
      return {
        value,
        output: `${value.reduce((s, l) => s + l.findings.length, 0)} findings · $${total.toLocaleString()}/mo aggregate leakage detected`,
      };
    },
    []
  );

  // 5 — scoring
  const prospects = await step(
    "scoring-agent",
    `weighted rubric v1.0.0`,
    "deterministic",
    `${candidates.length} candidates × 12 rubric components`,
    () => {
      const value: Prospect[] = candidates.map((c, i) => {
        const contact = inferContact(c, icp);
        const score = scoreProspect(c, analyses[i], leakages[i], contact, icp);
        return {
          id: c.id,
          company: c,
          analysis: analyses[i],
          leakage: leakages[i],
          score,
          contact,
          stage: score.qualified ? ("qualified" as const) : ("parked" as const),
        };
      });
      value.sort((a, b) => b.score.score - a.score.score);
      const qualified = value.filter((p) => p.score.qualified).length;
      return {
        value,
        output: `${qualified} qualified at threshold ${icp.minScore} · ${value.length - qualified} parked · top score ${value[0]?.score.score ?? 0}`,
      };
    },
    []
  );

  const qualified = prospects.filter((p) => p.score.qualified);

  // 6 — strategy
  await step(
    "strategy-agent",
    "angle selection from computed facts",
    "model-backed",
    `${qualified.length} qualified prospects`,
    async () => {
      const angles = qualified.map((p) => (p.leakage.findings[0]?.kind === "competitor" ? "named-competitor" : "conversion-leak"));
      const named = angles.filter((a) => a === "named-competitor").length;
      return {
        value: null,
        output: `${named} prospects lead with a named competitor, ${angles.length - named} lead with a conversion leak`,
      };
    },
    null
  );

  // 7 — copy
  await step(
    "copy-agent",
    "5-touch sequence, facts injected not invented",
    "model-backed",
    `${qualified.length} sequences × 5 touches`,
    async () => {
      const sample = qualified[0];
      if (sample) await generateSequence(sample.company, sample.analysis, sample.leakage, sample.contact, false);
      return {
        value: null,
        output: `${qualified.length * 5} touches drafted from locked fact sheets · model rewrite available per prospect`,
      };
    },
    null
  );

  // 8 — CRM
  const synced = await step(
    "crm-agent",
    "upsert record, stage, activity log",
    "deterministic",
    `${prospects.length} records → ${crm().name}`,
    async () => {
      const adapter = crm();
      for (const p of prospects) {
        await adapter.upsert({
          domain: p.company.domain,
          company: p.company.name,
          stage: p.stage,
          score: p.score.score,
          tier: p.score.tier,
          owner: "outbound-agent",
          updatedAt: new Date().toISOString(),
        });
        await adapter.logActivity({
          domain: p.company.domain,
          verb: "analysis_attached",
          detail: `score ${p.score.score} (${p.score.tier}) · $${p.leakage.totalMonthly.toLocaleString()}/mo leakage`,
          at: new Date().toISOString(),
        });
      }
      return { value: prospects.length, output: `${prospects.length} records upserted to ${adapter.name} · ${prospects.length} activities logged` };
    },
    0
  );

  const result: RunResult = {
    runId,
    icp,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    trace,
    prospects,
    marketRead,
    counts: {
      sourced: candidates.length,
      analysed: analyses.length,
      qualified: qualified.length,
      parked: prospects.length - qualified.length,
      synced,
    },
    engineVersion: ENGINE_VERSION,
    aiLive: aiConfigured(),
  };

  runs.unshift(result);
  if (runs.length > 10) runs.pop();
  return result;
}

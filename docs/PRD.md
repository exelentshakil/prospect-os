# Prospect OS — Autonomous Outbound Engine

**PRD v1.0 · Shakil Ahmed / BarakahSoft LLC**

A production-grade agentic system that runs the full outbound loop for a digital
marketing agency: ICP → sourcing → competitive analysis → leakage detection →
scoring → personalised multi-touch outreach → CRM sync → booked call.

---

## 1. Problem

Agencies sell on insight, but the insight is manual. A senior strategist spends
40–90 minutes per prospect pulling competitor rankings, spotting where the
prospect leaks conversions, and writing an email that proves it. That cost caps
outbound at a few dozen touches a week, so reps default to generic sequences
that get ignored.

Generic AI SDR tools fail the other way: they generate confident, unverifiable
copy. When the prospect replies "where did you get that number?", nobody can
answer, and the call is lost in the first 90 seconds.

## 2. Core principle (the architecture decision everything else follows from)

> **The rubric decides who is qualified. The model never does.**

Every number that reaches a prospect — visibility index, ranking trajectory,
leakage estimate, fit score — is produced by deterministic, version-pinned code
with a published formula and a human-readable `basis` string attached to it.
The language model is confined to two jobs: summarising research it was handed,
and writing copy around numbers it is forbidden to invent.

Consequences that make this a system rather than a prompt:

- Scores are reproducible. The same prospect scores identically on every run.
- The rubric is auditable at `/rubric` and `/api/rubric` — the client can read
  and change the weights without touching the agent.
- Every claim in an outbound email traces to a computed fact with a basis
  string, so a rep can defend it live on the call.
- Model swaps and prompt edits cannot silently change who gets contacted.

## 3. Scope

### In scope (v1)

| Area | Capability |
| --- | --- |
| ICP | Structured ICP + buyer-persona definition, editable, versioned, drives every downstream stage |
| Sourcing | Crawl/scrape/enrich pipeline producing candidate companies with firmographics |
| Competitive analysis | 3–4 largest competitors per prospect, organic visibility, 12-month ranking trajectory, weakest positions, SEO performance, revenue attribution |
| Leakage | Conversion-leakage and competitor-leakage detectors, each with a dollar estimate and a basis |
| Scoring | Weighted rubric → 0–100 fit score, A/B/C tier, per-component contribution |
| Outreach | Tailored strategy + 5-touch multi-channel sequence with follow-up branching |
| CRM | Read / write / update through a provider-agnostic adapter (demo, HubSpot, Salesforce) |
| Booking | Qualified-call scheduling tied to the analysis the agent prepared |
| Orchestration | Named sub-agents with a persisted, inspectable execution trace per run |

### Out of scope (v1)

- Sending live email from the client's production domain (warmup, SPF/DKIM/DMARC
  and deliverability are phase 3, not day one).
- LinkedIn automation that violates platform ToS. Channel two is a task queue a
  human executes, or a compliant partner API.
- Autonomous replies to inbound. The agent drafts; a human approves until
  reply-quality data justifies loosening the gate.

## 4. Sub-agent topology

The orchestrator runs eight named agents. Each writes a trace record: inputs,
outputs, duration, provider, and whether it ran deterministic or model-backed.

```
run(icp)
  ├─ 1 sourcing-agent      deterministic  crawl + firmographic filter → candidates
  ├─ 2 research-agent      model-backed   company summary, positioning, signals
  ├─ 3 seo-agent           deterministic  visibility index, trajectory, competitor map
  ├─ 4 leakage-agent       deterministic  conversion + competitor leakage, $ estimates
  ├─ 5 scoring-agent       deterministic  weighted rubric → score, tier, contributions
  ├─ 6 strategy-agent      model-backed   angle selection from the computed facts
  ├─ 7 copy-agent          model-backed   5-touch sequence, facts injected not invented
  └─ 8 crm-agent           deterministic  upsert record, stage, activity log
```

Deterministic agents are pure functions of their inputs. Model-backed agents
receive a fact sheet and are prompted to fail loudly rather than fill gaps.

## 5. Data model

```
icp_profiles      id, name, industries[], employee_range, regions, tech_signals[],
                  exclusions[], persona{title, pains[], triggers[]}, weights{}, version

prospects         id, company, domain, industry, employees, region, revenue_band,
                  score, tier, stage, owner, created_at, run_id

analyses          prospect_id, visibility_index, trajectory[12], competitors[4],
                  weak_positions[], seo{lcp, indexed, backlinks, schema},
                  revenue_attribution{}, computed_at, engine_version

leakage           prospect_id, kind(conversion|competitor), code, severity,
                  monthly_dollars, basis, evidence

sequences         prospect_id, strategy, touches[5]{day, channel, subject, body,
                  facts_used[]}, status, generated_by

crm_activity      prospect_id, verb, payload, provider, external_id, synced_at

calls             prospect_id, slot_start, timezone, attendees[], agenda_ref, status

runs              id, icp_id, started_at, finished_at, trace[], counts{}

traffic_logs      path, ip, city, region, country, user_agent, created_at
```

## 6. Pipeline (end to end)

1. **Define ICP** — industries, size band, region, tech signals, exclusions,
   persona pains and triggers, and the scoring weights themselves.
2. **Source** — crawl directories, maps and index pages; enrich firmographics;
   dedupe against CRM so the agent never surfaces an existing account.
3. **Analyse** — per prospect: fetch the site, resolve the top 3–4 organic
   competitors, compute a visibility index, plot 12-month trajectory, find the
   keyword sets where the prospect is weakest and a competitor is strongest.
4. **Detect leakage** — conversion leakage from on-site signals (LCP, form
   friction, missing tracking, weak CTA path, no schema). Competitor leakage
   from share-of-voice loss and branded-term bleed. Both priced monthly.
5. **Score** — weighted rubric across fit, pain, timing and reachability. Tier
   A/B/C. Below threshold, the prospect is parked, not contacted.
6. **Strategise + write** — pick the sharpest angle from the computed facts,
   then generate a 5-touch sequence that leads with the single most defensible
   number.
7. **Sync CRM** — upsert the record, attach the analysis, set stage and owner,
   log every activity.
8. **Book** — the call is framed as a walkthrough of the analysis already
   prepared, which is why it converts better than a generic discovery ask.

## 7. Non-functional requirements

- **Auditability** — every number carries a basis string; the rubric is a
  published endpoint; each run stores a full trace.
- **Determinism** — reruns produce identical scores for identical inputs.
- **Provider independence** — model chain read from env with fallback; CRM and
  email behind adapters; no vendor is load-bearing.
- **Zero-credential demo path** — the whole loop runs without a single API key
  so a reviewer can click through; `/api/health` shows which layers are live.
- **Rate-limit and cost control** — per-run token ceiling, cached analyses,
  backoff on every external call.
- **Compliance** — CAN-SPAM/CASL footer, suppression list checked before every
  send, ToS-safe channels only.

## 8. Phases

| Phase | Content |
| --- | --- |
| 0 (built) | Working demo: full 8-agent loop, deterministic analysis + rubric, leakage engine, sequence generation, demo CRM, booking, trace viewer, published rubric |
| 1 | Real data plane: live crawl + enrichment provider, real SERP/visibility API, PageSpeed, ICP calibration against closed-won accounts |
| 2 | Real CRM: HubSpot adapter (read/write/update, custom properties, activity timeline), dedupe and ownership rules |
| 3 | Live outreach: domain warmup, sending infra, reply detection, branching follow-ups, suppression and compliance |
| 4 | Booking + handoff: calendar integration, call brief auto-generated from the analysis, rep-facing prep doc |
| 5 | Scale + learn: scheduled autonomous runs, reply-outcome feedback into the rubric weights, dashboards |

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Model invents a number in an email | Facts injected as a locked sheet; copy validated against it before send; anything unmatched blocks the touch |
| Scraping blocked or ToS-hostile | Provider adapters (Apollo/Clay/serp APIs) behind one interface; no ToS-violating channel in v1 |
| Deliverability burned by volume | Warmup phase, per-domain caps, suppression list, human gate until reply data is healthy |
| CRM duplicate pollution | Dedupe against CRM before sourcing completes; upsert on domain, never blind create |
| Score drift after prompt edits | Scoring is deterministic code, not a prompt — prompts cannot move the qualification bar |
| Provider deprecation | Env-driven model fallback chain; deterministic path keeps working with zero providers |

## 10. Acceptance criteria (mapped to the brief)

- [x] Define and operationalise ICP and buyer personas, targetable across industries
- [x] Prospecting tool that crawls, scrapes and identifies target companies
- [x] Competitive analysis: 3–4 biggest competitors, organic visibility, ranking trajectory, weakest positions, SEO performance, revenue attribution
- [x] Detect conversion leakage and competitor leakage
- [x] Tailored outreach strategy, multi-touch sequences with follow-ups
- [x] CRM integration for reading, writing and updating records
- [x] Book qualified calls to review the analysis the agent prepared
- [x] Orchestrate sub-agents for research, scoring, copy and CRM updates
- [x] Python or TypeScript orchestration with custom tools
- [x] Clean documentation

Phase 0 satisfies every line above against the demo data plane and adapter
layer. Phases 1–3 swap simulated providers for live ones without changing the
orchestrator, the rubric, or the trace format — that is the point of the
adapter boundary.

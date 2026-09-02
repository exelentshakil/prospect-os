# Prospect OS — Build Estimate

**Shakil Ahmed · BarakahSoft LLC · $150/hr**
Autonomous Claude Code sales agent and prospecting engine

---

## Summary

| | |
| --- | --- |
| Phase 0 (already built and deployed) | 26 hrs · **Freelance** |
| Phases 1–5 to a live system on your data | 170 hrs · **$25,500** |
| Calendar at 30 hrs/week | ~6 weeks |
| Fixed-price alternative | **$23,900** on milestones |

---

## Phase 0 — Working demo · 26 hrs · Freelance

Built before this proposal was sent. Live at the demo URL, source on GitHub.

| Item | Hours |
| --- | --- |
| 8-agent orchestrator with persisted execution trace (inputs, outputs, duration, mode per step) | 4 |
| Deterministic competitive analysis engine: visibility index, 12-month trajectory, 3–4 competitor map, weakest-position clusters with CTR-curve maths | 5 |
| Leakage engine: 5 conversion detectors + 3 competitor detectors, each priced monthly with a published basis string | 4 |
| Scoring rubric: 12 weighted components across fit / pain / timing / reachability, published at `/rubric` and `/api/rubric` | 3 |
| Outreach generation: 5-touch multi-channel sequence, fact-sheet injection, model rewrite with a validation gate that rejects invented numbers | 4 |
| CRM adapter interface + demo store, stage transitions, activity log | 2 |
| Qualified-call booking with an agenda auto-built from the prepared analysis | 1.5 |
| Dashboard, prospect deep-dive, CRM board, rubric page, light/dark, health endpoint | 2.5 |
| Deploy, docs, PRD | — |

**Why it is free:** you should be able to click a link and judge the system
before you spend anything. It also answers the only question that matters at
this stage — whether this is a real agentic pipeline or a prompt with a UI.

---

## Phase 1 — Live data plane · 42 hrs · $6,300

Swap the simulated sourcing and SERP layers for live providers behind the
existing adapters.

| Item | Hours |
| --- | --- |
| Crawler + firmographic enrichment adapter (Apollo / Clay / custom), rate limiting, caching, cost ceilings | 14 |
| SERP + visibility provider integration, keyword cluster resolution, competitor discovery | 12 |
| PageSpeed / CWV and on-site signal collection for the conversion detectors | 6 |
| ICP calibration against your closed-won accounts, weight tuning, backtest against known wins and losses | 8 |
| Provider failover and cost telemetry | 2 |

## Phase 2 — CRM integration · 30 hrs · $4,500

| Item | Hours |
| --- | --- |
| HubSpot (or Salesforce) adapter: read, write, update, custom properties, associations | 12 |
| Dedupe and suppression against existing accounts and open opportunities before sourcing completes | 7 |
| Activity timeline: analysis attachments, sequence events, stage transitions with owner rules | 7 |
| Two-way sync and conflict handling | 4 |

## Phase 3 — Outreach execution · 46 hrs · $6,900

| Item | Hours |
| --- | --- |
| Sending infrastructure, domain and inbox warmup, per-domain caps and throttling | 12 |
| Reply detection, classification and branching follow-ups | 12 |
| Second channel (compliant LinkedIn task queue or partner API) | 8 |
| Suppression list, CAN-SPAM / CASL compliance, unsubscribe handling | 6 |
| Human approval gate with a review queue, loosened as reply data justifies | 8 |

## Phase 4 — Booking and handoff · 20 hrs · $3,000

| Item | Hours |
| --- | --- |
| Calendar integration (Google / Outlook), routing and round-robin | 8 |
| Auto-generated call brief from the prepared analysis, rep-facing prep doc | 7 |
| No-show and reschedule handling, reminders | 5 |

## Phase 5 — Autonomy and feedback loop · 32 hrs · $4,800

| Item | Hours |
| --- | --- |
| Scheduled autonomous runs with budget and volume guardrails | 8 |
| Reply and meeting outcomes fed back into rubric weight calibration | 12 |
| Operator dashboards: run history, cost per booked call, agent-level failure surfacing | 8 |
| Documentation, handover and a working session with your team | 4 |

---

## Cadence

30 hrs/week, matching the posting. Phases 1–5 land in roughly six weeks, and
each phase is independently useful — phase 1 alone gives you real scored
prospects on real data, phase 3 turns the whole thing on.

| Week | Focus |
| --- | --- |
| 1–2 | Phase 1 — live data plane, ICP calibrated against your closed-won |
| 3 | Phase 2 — CRM read/write/update in production |
| 4–5 | Phase 3 — sending, replies, branching, compliance |
| 5–6 | Phase 4 + 5 — booking, briefs, autonomous runs, dashboards |

## Running cost at volume

Per 1,000 prospects fully analysed and sequenced:

| Layer | Cost |
| --- | --- |
| Model (research + copy, flash-class with fallback chain) | ~$7 |
| SERP / visibility data | $20–50 |
| Enrichment and contact data | $100–300 |
| Sending infrastructure | ~$300/mo flat for a warmed pool |
| Hosting, queue, database | ~$40/mo |

Roughly **$150–400 per thousand fully worked prospects**, plus ~$340/mo fixed.
The deterministic layers cost nothing per run, which is a large part of why the
architecture is split the way it is.

---

## On the rate

The posting ranges to $100/hr and I bid $150. The number worth comparing is the
total, not the rate.

| | Hours | Total | Calendar |
| --- | --- | --- | --- |
| This bid | 170 | $25,500 | ~6 weeks |
| A $50/hr generalist, same scope | 320–420 | $16,000–21,000 | 3–4 months |
| A $16/hr average, same scope | rarely completes | — | — |

The gap is not effort, it is rework. Phase 0 exists because I have already built
the hard parts — the trace format, the fact-locking gate, the adapter
boundaries — and you can read all of it before hiring me. The generalist number
above also assumes the architecture survives contact with production, which is
the part that usually does not.

**Scoped-down option:** phases 1–3 only — live data, CRM, outreach running —
118 hrs, **$17,700**. Booking stays manual, autonomy comes later. This is the
smallest version that is genuinely useful in production.

**Fixed-price alternative:** $23,900 for phases 1–5, paid on five milestones,
one per phase. You trade a little flexibility for total certainty on cost.

---

## What I need from you to start

1. CRM and which object model you use (HubSpot / Salesforce / other).
2. A list of 20–50 closed-won accounts, so the ICP is calibrated rather than
   asserted.
3. Sending domain preference — a fresh warmed domain is strongly recommended
   over your primary.
4. Data provider preference, or let me choose on cost/coverage.

Nothing above blocks phase 1 starting immediately.

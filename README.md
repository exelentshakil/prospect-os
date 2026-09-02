# Prospect OS — Autonomous Outbound Engine

ICP in, booked call out. Eight named sub-agents run the full loop: sourcing,
competitive analysis, leakage detection, deterministic scoring, multi-touch
outreach, CRM sync and call booking — with a traced, auditable step record for
every run.

**Live demo:** https://prospect-os-tau.vercel.app · **Rubric:** `/rubric` ·
**Health:** `/api/health`

## The one architectural decision

> The rubric decides who is qualified. The model never does.

Every number that reaches a prospect — visibility index, ranking trajectory,
leakage estimate, fit score — is produced by deterministic, version-pinned code
with a published formula and a human-readable `basis` string attached. The
language model is confined to two jobs: summarising research it was handed, and
writing copy around numbers it is forbidden to invent.

Concretely:

- **Scores are reproducible.** Same prospect, same score, every run.
- **The rubric is auditable** at [`/rubric`](/rubric) and `/api/rubric` — twelve
  weighted components across fit, pain, timing and reachability.
- **Copy is fact-locked.** The copy agent receives a fact sheet and generated
  output is validated against it; any dollar figure not on the sheet fails that
  touch back to the deterministic version.
- **Prompt edits cannot move the qualification bar.** Only rubric edits can.

## Sub-agent topology

| # | Agent | Mode | Does |
| --- | --- | --- | --- |
| 1 | `sourcing-agent` | deterministic | crawl + firmographic filter against the ICP |
| 2 | `research-agent` | model-backed | positioning and signal summary |
| 3 | `seo-agent` | deterministic | visibility index, 12-month trajectory, competitor map, weakest positions |
| 4 | `leakage-agent` | deterministic | conversion + competitor leakage, priced monthly |
| 5 | `scoring-agent` | deterministic | 12-component weighted rubric → score, tier |
| 6 | `strategy-agent` | model-backed | angle selection from the computed facts |
| 7 | `copy-agent` | model-backed | 5-touch sequence, facts injected not invented |
| 8 | `crm-agent` | deterministic | upsert record, set stage, log activity |

Every step emits a trace record with inputs, outputs, duration and mode, shown
live on the dashboard.

## Running it

```bash
npm install
npm run dev
```

No credentials required. The whole loop runs on the deterministic path with
zero API keys — that is a design requirement, not a demo shortcut.

### Optional env

| Variable | Effect when set |
| --- | --- |
| `GEMINI_API_KEY` | research + copy agents switch from deterministic to model-written |
| `GEMINI_MODELS` | comma-separated fallback chain, default `gemini-2.5-flash,gemini-2.0-flash` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | durable CRM records, calls and `/traffic` analytics (server-only, never `NEXT_PUBLIC_`) |
| `HUBSPOT_ACCESS_TOKEN` | activates the HubSpot CRM adapter in place of the demo store |

`/api/health` reports exactly which layers are live.

## Endpoints

| Route | Purpose |
| --- | --- |
| `POST /api/pipeline/run` | run the full 8-agent loop, returns prospects + trace |
| `GET /api/rubric` | the published qualification logic |
| `GET /api/health` | which layers are live vs simulated |
| `POST /api/outreach/[id]` | regenerate a sequence, model-backed when configured |
| `PATCH /api/prospects/[id]/stage` | CRM stage update through the adapter |
| `GET/POST /api/calls` | slots and qualified-call booking |
| `GET /api/crm` | records, activity log, bookings |

## What is real and what is simulated

Real: the orchestrator, the trace, the rubric, the scoring maths, the leakage
formulas, the copy generation and its validation gate, the CRM adapter
interface, the booking flow, persistence.

Simulated: the sourcing plane (36 fictional companies) and the SERP/visibility
data behind the analysis. Both sit behind adapters — phase 1 swaps in a live
crawler, an enrichment provider and a SERP API without changing anything
downstream.

See [`docs/PRD.md`](docs/PRD.md) for scope and phasing,
[`docs/ESTIMATE.md`](docs/ESTIMATE.md) for the build plan and cost.

Built by Shakil Ahmed · BarakahSoft LLC · https://shakilhq.com

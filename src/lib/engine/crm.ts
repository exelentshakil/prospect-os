import { isMissingTable, supabase } from "../supabase";
import type { Stage } from "./types";

// CRM behind an adapter. The orchestrator only ever calls this interface, so
// swapping the demo store for HubSpot or Salesforce in phase 2 touches exactly
// one file and leaves the agent, the rubric and the trace format untouched.

export interface CrmRecord {
  domain: string;
  company: string;
  stage: Stage;
  score: number;
  tier: string;
  owner: string;
  updatedAt: string;
}

export interface CrmActivity {
  domain: string;
  verb: string;
  detail: string;
  at: string;
}

export interface CrmAdapter {
  name: string;
  live: boolean;
  upsert(record: CrmRecord): Promise<CrmRecord>;
  updateStage(domain: string, stage: Stage): Promise<void>;
  logActivity(activity: CrmActivity): Promise<void>;
  findByDomain(domain: string): Promise<CrmRecord | null>;
  list(): Promise<CrmRecord[]>;
  activity(domain?: string): Promise<CrmActivity[]>;
}

interface MemoryState {
  records: Map<string, CrmRecord>;
  activity: CrmActivity[];
}

const globalState = globalThis as unknown as { __crm?: MemoryState };
const state: MemoryState = globalState.__crm ?? { records: new Map(), activity: [] };
globalState.__crm = state;

class DemoCrmAdapter implements CrmAdapter {
  name = "demo-crm";
  live = true;

  private async persist(record: CrmRecord) {
    const db = supabase();
    if (!db) return;
    const { error } = await db.from("crm_records").upsert(
      {
        domain: record.domain,
        company: record.company,
        stage: record.stage,
        score: record.score,
        tier: record.tier,
        owner: record.owner,
        updated_at: record.updatedAt,
      },
      { onConflict: "domain" }
    );
    if (error && !isMissingTable(error)) {
      console.error("crm_records upsert failed", error.message);
    }
  }

  async upsert(record: CrmRecord) {
    const existing = state.records.get(record.domain);
    const merged = { ...record, stage: existing?.stage ?? record.stage };
    state.records.set(record.domain, merged);
    await this.persist(merged);
    return merged;
  }

  async updateStage(domain: string, stage: Stage) {
    const existing = state.records.get(domain);
    if (existing) {
      existing.stage = stage;
      existing.updatedAt = new Date().toISOString();
      await this.persist(existing);
    }
    await this.logActivity({
      domain,
      verb: "stage_change",
      detail: `stage set to ${stage}`,
      at: new Date().toISOString(),
    });
  }

  async logActivity(activity: CrmActivity) {
    state.activity.unshift(activity);
    if (state.activity.length > 400) state.activity.pop();
    const db = supabase();
    if (!db) return;
    await db.from("crm_activity").insert({
      domain: activity.domain,
      verb: activity.verb,
      detail: activity.detail,
      created_at: activity.at,
    });
  }

  async findByDomain(domain: string) {
    return state.records.get(domain) ?? null;
  }

  async list() {
    return Array.from(state.records.values()).sort((a, b) => b.score - a.score);
  }

  async activity(domain?: string) {
    return domain ? state.activity.filter((a) => a.domain === domain) : state.activity;
  }
}

// Shape of the phase-2 adapter. Present so the interface boundary is visible
// rather than asserted; it activates the moment a token exists.
class HubspotAdapter extends DemoCrmAdapter {
  name = "hubspot";
  live = Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
}

export function crm(): CrmAdapter {
  return process.env.HUBSPOT_ACCESS_TOKEN ? new HubspotAdapter() : new DemoCrmAdapter();
}

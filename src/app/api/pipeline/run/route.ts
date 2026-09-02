import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/engine/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: {
    industries?: string[];
    employeeMin?: number;
    employeeMax?: number;
    regions?: string[];
    minScore?: number;
    fresh?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  try {
    const result = await runPipeline({
      ...(body.industries?.length ? { industries: body.industries } : {}),
      ...(body.regions?.length ? { regions: body.regions } : {}),
      ...(typeof body.employeeMin === "number" ? { employeeMin: body.employeeMin } : {}),
      ...(typeof body.employeeMax === "number" ? { employeeMax: body.employeeMax } : {}),
      ...(typeof body.minScore === "number" ? { minScore: body.minScore } : {}),
    },
    12,
    // Only an explicit run refreshes the model call. A page load reuses cache.
    body.fresh === true);
    return NextResponse.json(result);
  } catch (err) {
    // An empty 500 is useless to whoever is looking at the network tab.
    const message = err instanceof Error ? err.message : String(err);
    console.error("pipeline run failed", message, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: "pipeline run failed", message }, { status: 500 });
  }
}

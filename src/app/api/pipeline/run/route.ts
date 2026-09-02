import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/engine/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { industries?: string[]; employeeMin?: number; employeeMax?: number; regions?: string[]; minScore?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const result = await runPipeline({
    ...(body.industries?.length ? { industries: body.industries } : {}),
    ...(body.regions?.length ? { regions: body.regions } : {}),
    ...(typeof body.employeeMin === "number" ? { employeeMin: body.employeeMin } : {}),
    ...(typeof body.employeeMax === "number" ? { employeeMax: body.employeeMax } : {}),
    ...(typeof body.minScore === "number" ? { minScore: body.minScore } : {}),
  });
  return NextResponse.json(result);
}

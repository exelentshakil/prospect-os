import { NextResponse } from "next/server";
import { DEFAULT_ICP } from "@/lib/engine/icp";
import { RUBRIC } from "@/lib/engine/scoring";

export const dynamic = "force-dynamic";

// The qualification logic, published. A reviewer can audit exactly what decides
// who gets contacted without running the agent or trusting a model.
export function GET() {
  return NextResponse.json({
    rubric: RUBRIC,
    totalWeight: RUBRIC.components.reduce((s, c) => s + c.weight, 0),
    icp: DEFAULT_ICP,
    note: "Scores are deterministic. The same prospect scores identically on every run; model output cannot move these numbers.",
  });
}

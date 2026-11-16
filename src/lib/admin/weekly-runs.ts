import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { parseRunRecord, type AtlasRunSummary } from "./atlas-state";

export async function loadWeeklyRuns(): Promise<AtlasRunSummary[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("atlas_weekly_runs")
      .select("run_id, stage, status, updated_at, counts, errors")
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error || !data) return [];
    return data.flatMap((row) => {
      const record = row as Record<string, unknown>;
      const stage = typeof record.stage === "string" ? record.stage : "";
      const status = record.status === "failed" ? "FAILED" : stage === "DONE" ? "SUCCEEDED" : stage;
      const parsed = parseRunRecord({
        run_id: record.run_id,
        phase: stage === "DONE" ? "FINISHED" : stage,
        status,
        mode: "full",
        updated_at: record.updated_at,
        counts: record.counts,
        errors: record.errors,
      });
      return parsed ? [parsed] : [];
    });
  } catch {
    return [];
  }
}

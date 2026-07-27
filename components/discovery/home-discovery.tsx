"use client";

import { useSearchParams } from "next/navigation";
import type { BusinessProblem } from "@/src/content/schemas";
import { GuidedWorkflowFinder } from "./guided-workflow-finder";

export function HomeDiscovery() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const problemParam = searchParams.get("problem");
  const apisParam = searchParams.get("apis");
  const dataParam = searchParams.get("data");
  const industryParam = searchParams.get("industry");

  const initialApis = apisParam
    ? apisParam.split(",").filter(Boolean)
    : undefined;
  const initialData = dataParam
    ? dataParam.split(",").filter(Boolean)
    : undefined;
  const initialIndustry = industryParam ?? undefined;
  const initialMode =
    modeParam === "tools" || (!problemParam && initialApis?.length)
      ? "tools"
      : "problem";
  const initialProblem = (problemParam as BusinessProblem | null) ?? undefined;

  return (
    <GuidedWorkflowFinder
      initialMode={initialMode}
      initialProblem={initialProblem}
      initialSelected={initialApis}
      initialSelectedData={initialData}
      initialIndustry={initialIndustry}
    />
  );
}

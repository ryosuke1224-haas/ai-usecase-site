"use client";

import { useSearchParams } from "next/navigation";
import { GuidedWorkflowFinder } from "./guided-workflow-finder";

export function HomeDiscovery() {
  const searchParams = useSearchParams();
  const apisParam = searchParams.get("apis");
  const industryParam = searchParams.get("industry");

  const initialApis = apisParam
    ? apisParam.split(",").filter(Boolean)
    : undefined;
  const initialIndustry = industryParam ?? undefined;

  return (
    <GuidedWorkflowFinder
      initialSelected={initialApis}
      initialIndustry={initialIndustry}
    />
  );
}

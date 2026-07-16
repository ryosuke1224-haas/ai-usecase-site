"use client";

import { useSearchParams } from "next/navigation";
import { IndustryExplorer } from "./industry-explorer";
import { WorkflowFinder } from "./workflow-finder";

export function HomeDiscovery() {
  const searchParams = useSearchParams();
  const apisParam = searchParams.get("apis");
  const industryParam = searchParams.get("industry");

  const initialApis = apisParam
    ? apisParam.split(",").filter(Boolean)
    : undefined;
  const initialIndustry = industryParam ?? undefined;

  return (
    <>
      <WorkflowFinder initialSelected={initialApis} />
      <IndustryExplorer initialIndustry={initialIndustry} />
    </>
  );
}

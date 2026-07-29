import "server-only";
import { loadPublishedContent } from "@/src/content/load-published";
import type { UseCase } from "@/src/content/schemas";
import {
  businessAreaDefinitions,
  type BusinessArea,
  type BusinessAreaDefinition,
} from "./business-areas";

export type BusinessProcessGroup = {
  name: string;
  useCases: UseCase[];
};

export type BusinessAreaOverview = BusinessAreaDefinition & {
  workflowCount: number;
};

export function getUseCasesForBusinessArea(area: BusinessArea): UseCase[] {
  return loadPublishedContent().useCases.filter(
    (useCase) => useCase.businessArea === area,
  );
}

/**
 * Groups the area's published use cases under its process taxonomy.
 * Processes with no published blueprint are returned with an empty list so the
 * page can show an honest "coming soon" state instead of filler content.
 */
export function getBusinessProcessGroups(
  area: BusinessAreaDefinition,
): BusinessProcessGroup[] {
  const useCases = getUseCasesForBusinessArea(area.slug);

  return area.processes.map((name) => ({
    name,
    useCases: useCases.filter((useCase) =>
      useCase.businessProcesses?.includes(name),
    ),
  }));
}

/** Use cases in the area that are not attached to any process in the taxonomy. */
export function getUnmappedAreaUseCases(
  area: BusinessAreaDefinition,
): UseCase[] {
  const processes = new Set(area.processes);
  return getUseCasesForBusinessArea(area.slug).filter(
    (useCase) =>
      !useCase.businessProcesses?.some((process) => processes.has(process)),
  );
}

export function getBusinessAreaOverviews(): BusinessAreaOverview[] {
  const useCases = loadPublishedContent().useCases;

  return businessAreaDefinitions.map((area) => ({
    ...area,
    workflowCount: useCases.filter((useCase) => useCase.businessArea === area.slug)
      .length,
  }));
}

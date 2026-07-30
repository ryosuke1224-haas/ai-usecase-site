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
  /** Workflows whose primary process is this one — rendered as full cards. */
  useCases: UseCase[];
  /** Workflows primarily filed elsewhere in this area — referenced by name only. */
  relatedUseCases: UseCase[];
};

export type BusinessAreaProcessSections = {
  /** Processes with at least one primary workflow, in taxonomy order. */
  covered: BusinessProcessGroup[];
  /** Processes only touched by a workflow filed under another process. */
  partiallyCovered: BusinessProcessGroup[];
  /** Processes with no published workflow at all. */
  empty: string[];
};

export type BusinessAreaOverview = BusinessAreaDefinition & {
  workflowCount: number;
};

/**
 * The process a workflow is filed under. Falls back to the first entry of the
 * legacy `businessProcesses` list so older content still groups correctly.
 */
export function getPrimaryProcess(useCase: UseCase): string | undefined {
  return useCase.primaryBusinessProcess ?? useCase.businessProcesses?.[0];
}

/** Other processes the workflow supports, excluding its primary process. */
export function getRelatedProcesses(useCase: UseCase): string[] {
  const related =
    useCase.relatedBusinessProcesses ??
    useCase.businessProcesses?.slice(1) ??
    [];
  const primary = getPrimaryProcess(useCase);
  return related.filter((process) => process !== primary);
}

export function getUseCasesForBusinessArea(area: BusinessArea): UseCase[] {
  return loadPublishedContent().useCases.filter(
    (useCase) => useCase.businessArea === area,
  );
}

/**
 * Splits an area's process taxonomy into covered, partially covered, and empty
 * processes. Each workflow is assigned to exactly one process group, so a
 * business-area page renders every workflow card once.
 */
export function getBusinessAreaProcessSections(
  area: BusinessAreaDefinition,
): BusinessAreaProcessSections {
  const useCases = getUseCasesForBusinessArea(area.slug);

  const covered: BusinessProcessGroup[] = [];
  const partiallyCovered: BusinessProcessGroup[] = [];
  const empty: string[] = [];

  for (const name of area.processes) {
    const primary = useCases.filter(
      (useCase) => getPrimaryProcess(useCase) === name,
    );
    const related = useCases.filter((useCase) =>
      getRelatedProcesses(useCase).includes(name),
    );

    if (primary.length > 0) {
      covered.push({ name, useCases: primary, relatedUseCases: related });
    } else if (related.length > 0) {
      partiallyCovered.push({ name, useCases: [], relatedUseCases: related });
    } else {
      empty.push(name);
    }
  }

  return { covered, partiallyCovered, empty };
}

/** Use cases in the area whose primary process is not part of the taxonomy. */
export function getUnmappedAreaUseCases(
  area: BusinessAreaDefinition,
): UseCase[] {
  const processes = new Set(area.processes);
  return getUseCasesForBusinessArea(area.slug).filter((useCase) => {
    const primary = getPrimaryProcess(useCase);
    return !primary || !processes.has(primary);
  });
}

export function getBusinessAreaOverviews(): BusinessAreaOverview[] {
  const useCases = loadPublishedContent().useCases;

  return businessAreaDefinitions.map((area) => ({
    ...area,
    workflowCount: useCases.filter((useCase) => useCase.businessArea === area.slug)
      .length,
  }));
}

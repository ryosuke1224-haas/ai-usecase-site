import { FaqList } from "@/components/use-case/faq-list";
import { getBusinessArea } from "@/src/lib/business-areas";
import type { UseCase, UseCaseExperience } from "@/src/types";
import {
  AiHumanSplit,
  ExperienceSection,
  LearningObjectives,
  OutcomeStrip,
  SafetySection,
  WorkflowSteps,
} from "./experience-sections";
import { GuidedAiDemos } from "./guided-ai-demos";
import { FinalPurchaseCta, OfferComparison } from "./offer-comparison";
import { SampleBriefing } from "./sample-briefing";
import { StarterKitCta } from "./starter-kit-cta";
import { UseCaseHero } from "./use-case-hero";

/**
 * Page template for use cases with templateVersion "experience-v2".
 * Free Starter journey leads with the guided demo before deeper education,
 * then converts to the Starter Kit and shows Local/App options.
 */
export function ExperienceUseCasePage({
  useCase,
  experience,
}: {
  useCase: UseCase;
  experience: UseCaseExperience;
}) {
  const area = useCase.businessArea
    ? getBusinessArea(useCase.businessArea)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <UseCaseHero
        title={useCase.title}
        areaTitle={area?.title}
        areaHref={area ? `/business-areas/${area.slug}` : undefined}
        processName={useCase.primaryBusinessProcess}
        statusLabel={useCase.status === "preview" ? "Preview" : undefined}
        hero={experience.hero}
        demo={experience.conceptDemo}
      />

      <div className="mt-12 space-y-12 sm:mt-14 sm:space-y-14">
        <OutcomeStrip outcomes={experience.outcomes} />
        <SampleBriefing sampleBriefing={experience.sampleBriefing} />

        {experience.guidedDemos && (
          <GuidedAiDemos guidedDemos={experience.guidedDemos} />
        )}

        <WorkflowSteps workflow={experience.workflow} />
        <AiHumanSplit responsibilities={experience.responsibilities} />
        <LearningObjectives
          learning={experience.learning}
          philosophy={experience.philosophy}
        />

        {experience.starterCta && (
          <StarterKitCta starterCta={experience.starterCta} />
        )}

        <OfferComparison offers={experience.offers} />
        <SafetySection safety={experience.safety} />

        <ExperienceSection id="faq" heading="Questions before you start">
          <FaqList items={experience.faq} />
        </ExperienceSection>

        <FinalPurchaseCta finalCta={experience.finalCta} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { BusinessAreaIcon } from "./business-area-icon";
import type { BusinessAreaDefinition } from "@/src/lib/business-areas";
import { japaneseBusinessArea, japaneseExampleCount } from "@/src/lib/i18n/business-areas";
import type { UiLocale } from "@/src/lib/i18n/locale";

export function BusinessAreaCard({
  area,
  workflowCount,
  locale = null,
}: {
  area: BusinessAreaDefinition;
  workflowCount?: number;
  locale?: UiLocale | null;
}) {
  const japanese = locale === "ja" ? japaneseBusinessArea(area.slug) : undefined;
  const title = japanese?.title ?? area.title;
  const description = japanese?.description ?? area.description;
  const href = locale === "ja" ? `/ja/business-areas/${area.slug}` : `/business-areas/${area.slug}`;
  const countLabel =
    typeof workflowCount === "number" && workflowCount > 0
      ? locale === "ja"
        ? japaneseExampleCount(workflowCount)
        : `${workflowCount} ${workflowCount === 1 ? "blueprint" : "blueprints"}`
      : locale === "ja"
        ? "この業務を見る"
        : "Explore area";
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-border/60 bg-card px-5 py-5 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <BusinessAreaIcon area={area.slug} />
      </div>
      <h3 className="mt-4 text-base font-semibold transition-colors group-hover:text-accent">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        {countLabel}
        <span className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </span>
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale, localizedHref } from "@/src/lib/i18n/locale";
import { getBusinessAreaOverviews } from "@/src/lib/business-area-content";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = siteCopy(locale).home;
  return {
    title: { absolute: "AI Use Case Atlas" },
    description: copy.body,
    alternates: { canonical: `/${locale}` },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const copy = siteCopy(locale).home;
  const areas = getBusinessAreaOverviews();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent sm:text-xs">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{copy.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={locale === "ja" ? "/ja/business-areas" : "/business-areas"}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            {copy.primary}
          </Link>
          <Link
            href={localizedHref(locale, "/use-cases")}
            className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:border-accent/40"
          >
            {copy.secondary}
          </Link>
        </div>
      </section>

      <section id="business-areas" className="mt-16 scroll-mt-24 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.areasTitle}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.areasBody}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <li key={area.slug}>
              <BusinessAreaCard area={area} workflowCount={area.workflowCount} locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="mt-16 scroll-mt-24 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.stepsTitle}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border/60 bg-surface/60 px-5 py-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold text-accent">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-muted">
          {copy.toolsPrompt}{" "}
          <Link href={locale === "ja" ? "/ja/find-workflows" : "/find-workflows"} className="font-medium text-accent hover:underline">
            {copy.toolsLink}
          </Link>
        </p>
      </section>
    </div>
  );
}

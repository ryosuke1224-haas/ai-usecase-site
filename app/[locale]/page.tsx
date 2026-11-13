import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { FeaturedLaunchProducts } from "@/components/home/featured-launch-products";
import { FeaturedTopics } from "@/components/topics/featured-topics";
import { loadPublishedContent } from "@/src/content/load-published";
import { siteCopy } from "@/src/lib/i18n/copy";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { JAPANESE_FEATURED_SLUGS, japaneseFeaturedCta } from "@/src/lib/i18n/featured-launch";
import { isUiLocale, localizedHref } from "@/src/lib/i18n/locale";
import { getBusinessAreaOverviews } from "@/src/lib/business-area-content";
import { isPublicJapaneseCatalogUseCase, japaneseCatalogHref } from "@/src/lib/i18n/japanese-catalog";
import { featuredTopics } from "@/src/lib/topics";

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
  const areas = getBusinessAreaOverviews(locale === "ja" ? isPublicJapaneseCatalogUseCase : undefined);
  const published = locale === "ja" ? loadPublishedContent().useCases : [];
  const featured = JAPANESE_FEATURED_SLUGS.flatMap((slug) => {
    const useCase = published.find((item) => item.slug === slug);
    const label = japaneseUseCase(slug);
    if (!useCase || !label || !isPublicJapaneseCatalogUseCase(useCase)) return [];
    return [{ slug, href: japaneseCatalogHref(useCase), title: label.title, body: label.summary, cta: japaneseFeaturedCta(slug) }];
  });

  return (
    <div className="launch-canvas mx-auto w-full max-w-6xl px-6 py-10 sm:py-16">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-12 shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_6%,transparent)] sm:px-10 sm:py-14 lg:px-14">
        <div className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />
        <p className={`text-xs font-semibold tracking-wide text-accent ${locale === "ja" ? "" : "uppercase"}`}>
          {copy.eyebrow}
        </p>
        <p className="mt-3 max-w-2xl text-sm font-medium text-foreground sm:text-base">
          {locale === "ja"
            ? "US Techの実務知見を、日本の仕事へ。"
            : "Practical US-tech workflow experience, applied to everyday business work."}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{copy.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={locale === "ja" ? "/ja/business-areas" : "/business-areas"}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {copy.primary}
          </Link>
          <Link
            href={localizedHref(locale, "/use-cases")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border/80 bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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

      {locale === "ja" ? (
        <FeaturedLaunchProducts products={featured} />
      ) : (
        <FeaturedTopics locale={locale} topics={featuredTopics(locale)} />
      )}

      <section id="how-it-works" className="mt-16 scroll-mt-24 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy.stepsTitle}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border/70 bg-card px-5 py-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold text-accent">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
        {locale === "ja" ? (
          <p className="mt-8 text-sm text-muted">
            <Link href="/ja/use-cases" className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              AI活用テンプレートを見る
            </Link>
          </p>
        ) : (
          <p className="mt-8 text-sm text-muted">
            {copy.toolsPrompt}{" "}
            <Link href="/find-workflows" className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              {copy.toolsLink}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

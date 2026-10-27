import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { getBusinessAreaOverviews } from "@/src/lib/business-area-content";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ja") return {};
  return {
    title: "業務から探す",
    description: siteCopy("ja").home.areasBody,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleBusinessAreasPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const copy = siteCopy("ja");
  const areas = getBusinessAreaOverviews();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] font-medium tracking-wider text-accent">{copy.nav.businessAreas}</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{copy.home.areasTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{copy.home.areasBody}</p>
      </header>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <li key={area.slug}>
            <BusinessAreaCard area={area} workflowCount={area.workflowCount} locale="ja" />
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-muted">
        <Link href="/ja/use-cases" className="font-medium text-accent hover:underline">
          AI活用テンプレートをすべて見る
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessAreaIcon } from "@/components/business-areas/business-area-icon";
import { getBusinessAreaProcessSections, getUseCasesForBusinessArea } from "@/src/lib/business-area-content";
import { getBusinessArea } from "@/src/lib/business-areas";
import { japaneseBusinessArea, japaneseExampleCount, japaneseProcessName } from "@/src/lib/i18n/business-areas";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const area = locale === "ja" ? japaneseBusinessArea(slug) : undefined;
  if (!area) return {};
  return {
    title: area.title,
    description: area.description,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleBusinessAreaPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const area = getBusinessArea(slug);
  const japanese = japaneseBusinessArea(slug);
  if (!area || !japanese) notFound();
  const { covered, empty } = getBusinessAreaProcessSections(area);
  const count = getUseCasesForBusinessArea(area.slug).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <Link href="/ja/business-areas" className="text-xs font-medium text-muted hover:text-accent">
        業務から探す
      </Link>
      <header className="mt-5 border-b border-border/60 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <BusinessAreaIcon area={area.slug} className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{japanese.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{japanese.description}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{japanese.intro}</p>
        <p className="mt-4 text-xs text-muted">{japaneseExampleCount(count)}</p>
      </header>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {area.processes.map((process) => {
          const examples = covered.find((group) => group.name === process)?.useCases.length ?? 0;
          const waiting = empty.includes(process);
          return (
            <section key={process} className="rounded-xl border border-border/60 bg-card px-5 py-5">
              <h2 className="text-base font-semibold">{japaneseProcessName(slug, process)}</h2>
              <p className="mt-2 text-sm text-muted">{waiting ? "例を準備しています" : japaneseExampleCount(examples)}</p>
            </section>
          );
        })}
      </div>
      <p className="mt-10 text-sm">
        <Link href="/ja/use-cases" className="font-medium text-accent hover:underline">
          AI活用テンプレートを見る
        </Link>
      </p>
    </div>
  );
}

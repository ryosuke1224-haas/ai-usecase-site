import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { legalDocument } from "@/src/lib/japan-launch/legal";

type PageProps = { params: Promise<{ locale: string; doc: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, doc } = await params;
  const document = locale === "ja" ? legalDocument(doc) : null;
  if (!document) return {};
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: `/ja/legal/${document.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function JapanLegalPage({ params }: PageProps) {
  const { locale, doc } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const document = legalDocument(doc);
  if (!document) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{document.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{document.description}</p>
      <div className="mt-10 space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

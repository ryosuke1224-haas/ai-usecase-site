import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { JAPAN_SUPPORT_RESPONSE, KNOWN_SUPPORT_EMAIL, japanSupportTopics } from "@/src/lib/japan-launch/legal";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = siteCopy(locale).contact;
  return {
    title: copy.title,
    description: copy.body,
    alternates: { canonical: `/${locale}/contact` },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const copy = siteCopy(locale).contact;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 text-lg text-muted">
        {locale === "ja" ? "購入、ログイン、返金、商品の内容についてご連絡ください。" : copy.body}
      </p>
      <div className="mt-10 space-y-6 rounded-2xl border border-border/60 bg-card p-8">
        {locale === "ja" ? (
          japanSupportTopics.map((topic) => (
            <div key={topic.title}>
              <h2 className="text-sm font-semibold tracking-wider text-muted">{topic.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{topic.body}</p>
            </div>
          ))
        ) : (
          <>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{copy.purchase}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy.purchaseBody}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{copy.product}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy.productBody}</p>
            </div>
          </>
        )}
        <div className="rounded-xl bg-surface p-4">
          <p className="text-sm font-medium">{copy.emailLabel}</p>
          <a href={`mailto:${KNOWN_SUPPORT_EMAIL}`} className="mt-1 block text-sm text-accent hover:underline">
            {KNOWN_SUPPORT_EMAIL}
          </a>
          {locale === "ja" ? <p className="mt-3 text-sm text-muted">返信の目安: {JAPAN_SUPPORT_RESPONSE}</p> : null}
          {locale !== "ja" && copy.response ? <p className="mt-2 text-sm text-muted">{copy.response}</p> : null}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "ツールから探す",
  robots: { index: false, follow: false },
};

export default async function LocaleFindWorkflowsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ツールから探す</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        すでに使っている会計、メール、予約、広告のツールが分かっているときは、その条件でAI活用テンプレートを絞り込めます。
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        <li>
          <Link href="/ja/use-cases" className="font-medium text-accent hover:underline">
            AI活用テンプレートを条件で探す
          </Link>
        </li>
        <li>
          <Link href="/ja/business-areas" className="font-medium text-accent hover:underline">
            業務から探す
          </Link>
        </li>
        <li>
          <Link href="/ja/apis" className="font-medium text-accent hover:underline">
            API・ツールを見る
          </Link>
        </li>
        <li>
          <Link href="/ja/data-sources" className="font-medium text-accent hover:underline">
            データソースを見る
          </Link>
        </li>
      </ul>
    </div>
  );
}

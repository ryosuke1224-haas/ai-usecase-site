import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/signup-form";
import { SITE_URL } from "@/src/lib/site";

const description = "AIや米国テックの最新動向を、短く読みやすい日本語でお届けします。";

export const metadata: Metadata = {
  title: "ニュースレター",
  description,
  alternates: { canonical: `${SITE_URL}/ja/newsletter` },
  openGraph: {
    title: "ニュースレター | AI Use Case Atlas",
    description,
    url: `${SITE_URL}/ja/newsletter`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function JapaneseNewsletterPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ニュースレター</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
        <p>AIや米国テックの最新動向を、短く読みやすい日本語でお届けします。</p>
        <p>
          すべてのニュースを追うのではなく、仕事への影響が大きいものだけを選び、「何が変わったのか」「実務でどう使えるのか」まで整理してまとめます。
        </p>
      </div>
      <p className="mt-6 text-sm font-medium text-foreground">お届けする内容:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        <li>OpenAI、Google、Anthropicなど主要AI企業のアップデート</li>
        <li>サンフランシスコを中心とした米国テックの動き</li>
        <li>仕事ですぐ試せるAI活用</li>
        <li>新しく公開したAI活用テンプレートやBlueprint</li>
      </ul>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        <p>忙しい中でも、数分で今知っておくべきことが分かる内容を目指します。</p>
        <p>
          現在、ニュースレター配信機能を準備しています。メールアドレスを登録しておくと、配信開始後に受け取れます。
        </p>
        <p>入力されたメールアドレスは、AI Use Case Atlasのニュースレターおよび更新情報の配信目的でのみ使用します。</p>
      </div>
      <NewsletterSignup source="ja-newsletter" idPrefix="newsletter" lead={false} />
      <p className="mt-6 text-sm">
        <Link href="/ja/legal/privacy" className="font-medium text-accent hover:underline">
          プライバシーポリシー
        </Link>
      </p>
    </main>
  );
}

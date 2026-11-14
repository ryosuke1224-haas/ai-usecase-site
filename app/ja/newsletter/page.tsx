import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/signup-form";
import { SITE_URL } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "ニュースレター",
  description: "実務に関係するAIと米国テックの更新を、日本語の短いメールで受け取る登録ページです。",
  alternates: { canonical: `${SITE_URL}/ja/newsletter` },
  openGraph: {
    title: "ニュースレター | AI Use Case Atlas",
    description: "実務に関係するAIと米国テックの更新を、日本語の短いメールで受け取る登録ページです。",
    url: `${SITE_URL}/ja/newsletter`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function JapaneseNewsletterPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold text-accent">日本語</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">ニュースレター</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        AI Use Case Atlas の更新を、短い日本語のメールで受け取るための登録です。
      </p>
      <ul className="mt-6 space-y-2 text-sm leading-relaxed text-foreground">
        <li>実務で使えるAIと、米国テックの動きを日本語でまとめます。</li>
        <li>仕事への影響が分かるものだけを選びます。</li>
        <li>新しいテンプレートを公開したときも案内します。</li>
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        登録は保存されます。メールの送信はまだ始まりません。配信を始めるときは、このページとプライバシーポリシーに書きます。
      </p>
      <NewsletterSignup source="ja-newsletter" idPrefix="newsletter" />
      <p className="mt-6 text-sm">
        <Link href="/ja/legal/privacy" className="font-medium text-accent hover:underline">
          プライバシーポリシー
        </Link>
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublishedContent } from "@/src/content/load-published";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

const ideas: Record<string, { title: string; summary: string }> = {
  "calendly-gmail-slack-openai": {
    title: "予約の通知とフォロー",
    summary: "予約、メール、社内連絡を組み合わせて、新しい予約の確認とフォローをまとめて扱います。",
  },
  "gmail-calendar-openai": {
    title: "メールと予定の整理",
    summary: "受信箱と予定を一緒に見て、返事と打ち合わせの準備を短くします。",
  },
  "google-drive-notion-openai": {
    title: "資料から手順書へ",
    summary: "既存の資料を手順と研修用の文書に整えます。",
  },
  "google-places-yelp-hubspot-openai": {
    title: "地域の見込み客探し",
    summary: "公開されている店舗情報から見込み客を探し、顧客管理に渡す前の文面を作ります。",
  },
  "google-sheets-gmail-openai": {
    title: "表計算とメールの運用",
    summary: "表計算を台帳にして、メールの内容を短くまとめます。",
  },
  "google-yelp-reputation-openai": {
    title: "口コミの確認と返信",
    summary: "Google と Yelp の口コミを読み、傾向と返信の下書きを作ります。",
  },
  "hubspot-gmail-claude-openai": {
    title: "営業の毎日の確認",
    summary: "顧客管理とメールから、商談前の要点、フォロー、止まりそうな案件を見ます。",
  },
  "outscraper-sheets-claude-openai": {
    title: "名簿からの調査",
    summary: "集めた店舗情報を表に置き、優先順位と調査メモを作ります。",
  },
  "salesforce-outlook-claude-openai": {
    title: "大規模な商談管理",
    summary: "Salesforce と Outlook の記録から、商談の抜けと優先順位を確認します。",
  },
  "square-gmail-twilio-openai": {
    title: "来店後の再案内",
    summary: "レジの売上と連絡先から、久々のお客様や無断キャンセルへの案内文を作ります。",
  },
};

export const metadata: Metadata = {
  title: "AI活用アイデア",
  robots: { index: false, follow: false },
};

export default async function LocaleWorkflowIdeasPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const { workflowIdeas, apis } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">{workflowIdeas.length}件</p>
        <h1 className="mt-1 text-2xl font-bold">AI活用アイデア</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          すでに入っているツールを組み合わせて、複数の業務に使う例です。
        </p>
      </header>
      <div className="mt-6 space-y-4">
        {workflowIdeas.map((idea) => {
          const copy = ideas[idea.slug];
          if (!copy) return null;
          const tools = idea.apiCombination.map((slug) => apis.find((api) => api.slug === slug)?.name ?? slug);
          return (
            <article key={idea.slug} className="rounded-xl border border-border/60 bg-card px-5 py-5">
              <h2 className="text-base font-semibold">{copy.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy.summary}</p>
              <p className="mt-3 text-xs text-muted">{tools.join(" · ")}</p>
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-sm">
        <Link href="/ja/use-cases" className="font-medium text-accent hover:underline">
          AI活用テンプレートを見る
        </Link>
      </p>
    </div>
  );
}

import type { UiLocale } from "@/src/lib/i18n/locale";

export type TopicStatus = "preparing" | "under-review";
export type TopicOfferingKind = "free" | "premium";

export type TopicOffering = {
  id: string;
  kind: TopicOfferingKind;
  name: Record<UiLocale, string>;
  status: TopicStatus;
};

export type Topic = {
  slug: string;
  featured: boolean;
  cardEyebrow: Record<UiLocale, string>;
  cardTitle: Record<UiLocale, string>;
  cardBody: Record<UiLocale, string>;
  cardCta: Record<UiLocale, string>;
  headline: Record<UiLocale, string>;
  purpose: Record<UiLocale, string>;
  checksTitle: Record<UiLocale, string>;
  checks: Record<UiLocale, string[]>;
  excludedTitle: Record<UiLocale, string>;
  excluded: Record<UiLocale, string[]>;
  plannedTitle: Record<UiLocale, string>;
  plannedNote: Record<UiLocale, string>;
  offerings: TopicOffering[];
};

export const topicStatusLabel: Record<TopicStatus, Record<UiLocale, string>> = {
  preparing: { ja: "準備中", en: "Preparing" },
  "under-review": { ja: "確認中", en: "Under review" },
};

const security: Topic = {
  slug: "security",
  featured: true,
  cardEyebrow: { ja: "注目テーマ", en: "Featured topic" },
  cardTitle: {
    ja: "セキュリティ対策を、何から始めるか。",
    en: "Where a small business can start on security.",
  },
  cardBody: {
    ja: "MFA、アカウント管理、バックアップ、アクセス権限など、中小企業がまず確認したいセキュリティ対策を、実行しやすい手順に整理します。",
    en: "MFA, account access, backups, and permissions, arranged as a practical sequence a small business can check first.",
  },
  cardCta: { ja: "セキュリティ対策を見る", en: "See security readiness" },
  headline: {
    ja: "中小企業のセキュリティ対策を、実行できる形に。",
    en: "Security checks a small business can actually carry out.",
  },
  purpose: {
    ja: "専任のセキュリティ担当がいない中小企業でも、まず確認すべき項目を整理し、優先順位をつけて取り組めるようにする。",
    en: "A small business without a security team can see what to check first and take it on in a workable order.",
  },
  checksTitle: { ja: "確認する項目", en: "What to check" },
  checks: {
    ja: [
      "MFA",
      "アカウントと権限",
      "管理者権限",
      "退職者アクセス",
      "バックアップ",
      "ソフトウェア更新",
      "SaaSの棚卸し",
      "インシデント時の連絡先",
      "フィッシング対応",
      "基本的なインシデント対応準備",
    ],
    en: [
      "MFA",
      "Accounts and access",
      "Administrator privileges",
      "Access after someone leaves",
      "Backups",
      "Software updates",
      "SaaS inventory",
      "Incident contacts",
      "Phishing response",
      "Basic incident-response preparation",
    ],
  },
  excludedTitle: { ja: "これは含まれません", en: "This does not include" },
  excluded: {
    ja: [
      "ペネトレーションテスト",
      "脆弱性スキャン",
      "マルウェア解析",
      "セキュリティ認証",
      "安全であることの保証",
    ],
    en: [
      "Penetration testing",
      "Vulnerability scanning",
      "Malware analysis",
      "Security certification",
      "A guarantee that the company is secure",
    ],
  },
  plannedTitle: { ja: "予定している内容", en: "Planned" },
  plannedNote: {
    ja: "どちらも、まだ購入できる商品ではありません。",
    en: "Neither item is for sale yet.",
  },
  offerings: [
    {
      id: "five-minute-security-check",
      kind: "free",
      name: { ja: "5分セキュリティチェック", en: "5-Minute Security Check" },
      status: "preparing",
    },
    {
      id: "security-readiness-action-pack",
      kind: "premium",
      name: { ja: "Security Readiness Action Pack", en: "Security Readiness Action Pack" },
      status: "under-review",
    },
  ],
};

/** Add a topic here to publish its page. Unknown slugs stay unpublished. */
export const topics: Topic[] = [security];

export function getTopic(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}

export function topicPath(locale: UiLocale, slug: string): string {
  return `/${locale}/topics/${slug}`;
}

export type FeaturedTopicCard = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

export function featuredTopics(locale: UiLocale): FeaturedTopicCard[] {
  return topics
    .filter((topic) => topic.featured)
    .map((topic) => ({
      slug: topic.slug,
      href: topicPath(locale, topic.slug),
      eyebrow: topic.cardEyebrow[locale],
      title: topic.cardTitle[locale],
      body: topic.cardBody[locale],
      cta: topic.cardCta[locale],
    }));
}

export const JAPAN_LAUNCH_REVIEW_REQUIRED = "JAPAN_LAUNCH_REVIEW_REQUIRED";

export type LaunchReviewStatus = "PASS" | "REVIEW REQUIRED" | "APPROVED" | "BLOCKED" | "NOT STARTED";

export type LaunchReviewItem = {
  id: string;
  label: string;
  status: LaunchReviewStatus;
  href: string | null;
  note: string;
};

const legalReview = "HUMAN LEGAL REVIEW。公開ページには確認用の注記を出していません。";

export const japanLaunchReviewItems: LaunchReviewItem[] = [
  {
    id: "japanese-ui",
    label: "日本語の画面",
    status: "REVIEW REQUIRED",
    href: "/ja",
    note: "案内、ナビゲーション、業務領域、購入画面の文言を確認してください。",
  },
  {
    id: "jp-price",
    label: "日本の価格",
    status: "REVIEW REQUIRED",
    href: "/ja/blueprints/ai-collections-assistant",
    note: "Sandbox の代金は 4,900円の買い切りです。総額としての表示を確認してください。消費税の登録状況は記載していません。",
  },
  {
    id: "tokusho",
    label: "特定商取引法に基づく表記",
    status: "REVIEW REQUIRED",
    href: "/ja/legal/tokusho",
    note: `氏名、所在地、電話番号は請求時開示の文案です。${legalReview}`,
  },
  {
    id: "terms",
    label: "利用規約",
    status: "REVIEW REQUIRED",
    href: "/ja/legal/terms",
    note: `日本法に準拠する文案を含みます。${legalReview}`,
  },
  {
    id: "privacy",
    label: "プライバシーポリシー",
    status: "REVIEW REQUIRED",
    href: "/ja/legal/privacy",
    note: `メール、認証、購入、Stripe、Supabase、運用記録、設定時の計測だけを書いています。${legalReview}`,
  },
  {
    id: "refund",
    label: "返金・キャンセルポリシー",
    status: "REVIEW REQUIRED",
    href: "/ja/legal/refund",
    note: `利用開始後のお客様都合は原則不可とし、重複請求、提供不能、重大な不具合、法令上の対応は確認します。${legalReview}`,
  },
  {
    id: "support",
    label: "サポート",
    status: "REVIEW REQUIRED",
    href: "/ja/contact",
    note: "連絡先は hello@aiusecaseatlas.com、返信の目安は原則3営業日以内です。",
  },
  {
    id: "purchase-disclosure",
    label: "購入前の表示",
    status: "REVIEW REQUIRED",
    href: "/ja/blueprints/ai-collections-assistant",
    note: "購入ボタンの前に、4,900円、提供時期、返金条件、利用規約、返金ポリシー、特定商取引法のリンクを出しています。",
  },
  {
    id: "japan-sandbox",
    label: "Japan Sandbox の決済",
    status: "PASS",
    href: "/ja/blueprints/ai-collections-assistant",
    note: "Japan Sandbox の購入確認は完了しています。この画面から新しい決済は始めません。",
  },
  {
    id: "production-stripe",
    label: "Production の Stripe",
    status: "NOT STARTED",
    href: null,
    note: "Live の商品、価格、Webhook は未着手です。",
  },
  {
    id: "production-launch",
    label: "Production 公開",
    status: "BLOCKED",
    href: null,
    note: "日本語の画面、価格、法務、サポート、購入前の表示、Production の Stripe を人が承認するまで公開できません。",
  },
];

const approvedStatuses = new Set<LaunchReviewStatus>(["PASS", "APPROVED"]);

export function japanLaunchDecision(): {
  ok: false;
  code: typeof JAPAN_LAUNCH_REVIEW_REQUIRED;
  blocking: LaunchReviewItem[];
} {
  return {
    ok: false,
    code: JAPAN_LAUNCH_REVIEW_REQUIRED,
    blocking: japanLaunchReviewItems.filter((item) => !approvedStatuses.has(item.status)),
  };
}

export function isJapanLaunchReviewVisible(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL_ENV !== "production";
}

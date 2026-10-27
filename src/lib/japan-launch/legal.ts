import { CONTACT_EMAIL } from "@/src/lib/site";

/**
 * Customer-facing Japan drafts. Unknown operator identity is handled by
 * disclosure on request. Internal approval lives in the launch review list.
 */
export const KNOWN_SUPPORT_EMAIL = CONTACT_EMAIL;

export const JAPAN_PRODUCT_PRICE = "4,900円";

export const japanPurchaseDisclosure = {
  product: "AI Collections Assistant",
  quantity: "1件の買い切り",
  price: JAPAN_PRODUCT_PRICE,
  total: `${JAPAN_PRODUCT_PRICE}・買い切り`,
  totalBody: `この ${JAPAN_PRODUCT_PRICE} が、AI Use Case Atlas を通じてお支払いいただく代金の総額です。`,
  availability: "決済確認後、すぐに利用できます。",
  refundNotice: "デジタル商品のため、利用開始後のお客様都合による返金は原則としてお受けしていません。",
  payment: "支払いは Stripe の決済画面で完了した時点で確定します。カード情報は AI Use Case Atlas のサーバーには保存しません。",
  links: [
    { href: "/ja/legal/terms", label: "利用規約" },
    { href: "/ja/legal/refund", label: "返金・キャンセルポリシー" },
    { href: "/ja/legal/tokusho", label: "特定商取引法に基づく表記" },
  ],
} as const;

export const japanSupportTopics = [
  {
    title: "購入後に開けないとき",
    body: "ログインに使ったメールアドレスと、商品名 AI Collections Assistant を書いて送ってください。",
  },
  {
    title: "重複した支払い",
    body: "同じ購入について代金が重なって請求された場合は、購入に使ったメールアドレスを書いてご連絡ください。",
  },
  {
    title: "返金の依頼",
    body: "返金・キャンセルポリシーに沿って確認します。購入に使ったメールアドレスと商品名を書いてください。",
  },
  {
    title: "アカウントとログイン",
    body: "ログイン用のメールが届かないときや、リンクの期限が切れたときは、同じメールアドレスでもう一度お試しください。解消しない場合はご連絡ください。",
  },
  {
    title: "商品についての質問",
    body: `AI Collections Assistantは、未回収・入金遅延の請求を整理し、フォローアップを支援するAI活用テンプレートです。代金は ${JAPAN_PRODUCT_PRICE} の買い切りです。`,
  },
] as const;

export const JAPAN_SUPPORT_RESPONSE = "原則3営業日以内";

export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDocument = {
  slug: "tokusho" | "terms" | "privacy" | "refund";
  title: string;
  description: string;
  sections: LegalSection[];
};

const priceNote = `AI Collections Assistantは、${JAPAN_PRODUCT_PRICE}の買い切り商品です。この${JAPAN_PRODUCT_PRICE}が、AI Use Case Atlasを通じてお支払いいただく代金の総額です。別途の販売手数料はかかりません。`;
const tokushoPriceNote = `AI Collections Assistantは、${JAPAN_PRODUCT_PRICE}の買い切り商品です。お支払いいただく総額は${JAPAN_PRODUCT_PRICE}です。当サイトから別途手数料を加算することはありません。`;

export const legalDocuments: Record<LegalDocument["slug"], LegalDocument> = {
  tokusho: {
    slug: "tokusho",
    title: "特定商取引法に基づく表記",
    description: "AI Use Case Atlas の通信販売に関する表記です。",
    sections: [
      {
        heading: "販売事業者・所在地・電話番号",
        body: [
          "販売事業者の氏名、所在地および電話番号については、ご請求があった場合、遅滞なく開示いたします。",
          `開示をご希望の場合は、${KNOWN_SUPPORT_EMAIL} までご連絡ください。`,
        ],
      },
      {
        heading: "お問い合わせ先",
        body: [`メール: ${KNOWN_SUPPORT_EMAIL}`],
      },
      { heading: "販売価格", body: [tokushoPriceNote] },
      {
        heading: "商品代金以外に必要な料金",
        body: [
          "デジタル商品のため送料はかかりません。",
          "インターネット接続に必要な通信料等はお客様の負担となります。",
          "AI Use Case Atlas が別途いただく決済手数料はありません。",
        ],
      },
      {
        heading: "支払方法",
        body: [
          "Stripeが提供する決済画面を通じて、利用可能なクレジットカードその他Stripeが対応する支払方法で支払います。",
          "カード情報はAI Use Case Atlasのサーバーには保存しません。",
        ],
      },
      {
        heading: "支払時期",
        body: ["Stripeの決済画面で支払いが完了した時点で決済が確定します。"],
      },
      {
        heading: "商品提供時期",
        body: ["決済確認後、原則として直ちに購入したアカウントへ利用権を付与します。"],
      },
      {
        heading: "返品・キャンセル・返金",
        body: [
          "Stripeの支払いを完了する前は、購入は確定しません。",
          "利用権の付与後は、お客様都合によるキャンセルおよび返金は原則としてお受けしません。",
          "重複請求、商品を提供できない不具合、合理的な期間内に解消できない重大な不具合、および適用される法令が定める場合は、返金・キャンセルポリシーに沿って確認します。",
        ],
      },
      {
        heading: "動作環境 / デジタル商品の提供条件",
        body: [
          "最新のデスクトップまたはモバイルブラウザと、ログインできるメールアドレスが必要です。",
          "AI Collections Assistantは、請求内容を人が確認して使うテンプレートです。メールの自動送信は行いません。",
          "商品はブラウザ上で提供します。",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "利用規約",
    description: "AI Use Case Atlas のアカウントとデジタル商品の利用条件です。",
    sections: [
      {
        heading: "サービス",
        body: [
          "AI Use Case Atlas は、中小企業の実務向けに、AI活用の手順とテンプレートを提供します。",
          "無料のテンプレートと、買い切りのプレミアムAI活用テンプレートがあります。",
        ],
      },
      {
        heading: "アカウント",
        body: [
          "ログインにはメールアドレスを使います。届いたリンクを開くと、そのブラウザでアカウントに入ります。",
          "パスワードは預かりません。アカウントの管理はご本人で行ってください。",
        ],
      },
      {
        heading: "有料コンテンツ",
        body: [
          priceNote,
          "利用権は、お支払いを確認したアカウントに 1 件付与します。別の人への共有や転売は想定していません。",
          "手順の実行、送信、数値の確認は、ご自身で行ってください。",
        ],
      },
      {
        heading: "AIが生成する内容",
        body: [
          "テンプレートが示す文章や整理結果は、AIが生成することがあります。その内容は不正確な場合や、不足している場合があります。",
          "金額、顧客への連絡、契約、請求など重要な出力は、業務で使う前にご自身で確認してください。",
          "AI Use Case Atlas は、メールその他の連絡を自動では送りません。",
        ],
      },
      {
        heading: "支払いと返金",
        body: [
          "支払いは Stripe の決済画面で行います。カード情報は AI Use Case Atlas のサーバーには保存しません。",
          "返金とキャンセルの条件は、返金・キャンセルポリシーに定めます。",
        ],
      },
      {
        heading: "禁止事項",
        body: [
          "不正な決済、他者のアカウントの利用、サイトへの過度な負荷、法令に反する利用はできません。",
        ],
      },
      {
        heading: "知的財産",
        body: [
          "サイト上の文章、構成、テンプレートの表現は、運営側または正当な権利者に帰属します。購入は、そのアカウントで使う権利であり、著作権の譲渡ではありません。",
        ],
      },
      {
        heading: "サービスの変更と一時停止",
        body: [
          "保守、障害対応、機能の見直しのため、サービスを変更し、または一時的に停止することがあります。",
          "停止中は、テンプレートを開けない時間が生じることがあります。",
        ],
      },
      {
        heading: "アカウントの停止",
        body: [
          "不正利用、禁止事項への該当、または他の利用者への支障がある場合は、アカウントの利用を止めることがあります。",
          "止める前に確認できるときは、登録されたメールアドレスへ連絡します。",
        ],
      },
      {
        heading: "責任の範囲",
        body: [
          "テンプレートの利用、AIの出力を採用するかどうか、顧客への送信、金額の判断は、利用者の責任で行ってください。",
          "AI Use Case Atlas は、出力が常に正確であることや、特定の売上、入金、業務結果を約束するものではありません。",
          "消費者契約法その他の法令により責任を制限できない場合は、その法令が優先します。",
        ],
      },
      {
        heading: "プライバシー",
        body: ["個人情報の扱いを含む情報の取り扱いは、プライバシーポリシーに定めます。"],
      },
      {
        heading: "規約の変更",
        body: [
          "利用条件を変更する場合は、変更後の文面をこのページに掲載します。",
          "規約を変更する場合は、このページへの掲載その他適切な方法でお知らせします。変更後の規約は、法令上必要な手続を経たうえで適用します。購入済みの利用権の対価を、掲載だけで引き上げるものではありません。",
        ],
      },
      {
        heading: "準拠法",
        body: ["本規約は日本法に準拠します。"],
      },
      {
        heading: "お問い合わせ",
        body: [`利用条件についての連絡先は ${KNOWN_SUPPORT_EMAIL} です。`],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "プライバシーポリシー",
    description: "AI Use Case Atlas が現在の機能で扱う情報です。",
    sections: [
      {
        heading: "アカウントのメールアドレス",
        body: ["ログイン用のメールを送るため、入力されたメールアドレスを認証に使います。"],
      },
      {
        heading: "認証情報",
        body: [
          "ログイン状態は、ブラウザの認証クッキーで維持します。",
          "パスワードは預かりません。ログイン用のリンクは、入力されたメールアドレスへ送ります。",
        ],
      },
      {
        heading: "購入情報",
        body: [
          "購入した商品と、そのアカウントに利用権があるかを記録します。",
          "カード番号やセキュリティコードは、AI Use Case Atlas では受け取りません。決済情報の処理は Stripe が行います。",
        ],
      },
      {
        heading: "Stripe による決済",
        body: ["代金の決済、決済の成否、返金が発生した場合の処理は Stripe が行います。AI Use Case Atlas が保存するのは、商品と利用権の対応です。"],
      },
      {
        heading: "Supabase に保存するアカウントと利用権",
        body: ["アカウントと、プレミアムAI活用テンプレートを開けるかどうかの記録は Supabase に保存します。"],
      },
      {
        heading: "運用とセキュリティの記録",
        body: ["不正利用の確認や障害対応のため、基本的なアクセス記録やエラー記録を扱う場合があります。"],
      },
      {
        heading: "計測",
        body: [
          "計測IDを設定している場合に限り、Google Analytics でページ閲覧が計測されることがあります。",
          "広告計測IDを設定している場合に限り、Google の広告向け設定が読み込まれることがあります。",
          "これらのIDを設定していない環境では、その計測は読み込まれません。",
        ],
      },
      {
        heading: "このサービスがアカウント作成や購入の条件にしていないもの",
        body: [
          "電話番号、住所、位置情報、請求書の実データは、アカウント作成や購入の条件にしていません。",
          "テンプレートに入力した業務データは、その操作の中で扱うものであり、運営が顧客台帳として集めるものではありません。",
        ],
      },
      {
        heading: "連絡先",
        body: [`この方針についての連絡先は ${KNOWN_SUPPORT_EMAIL} です。`],
      },
    ],
  },
  refund: {
    slug: "refund",
    title: "返金・キャンセルポリシー",
    description: "デジタル商品の返金とキャンセルの条件です。",
    sections: [
      {
        heading: "支払い完了前",
        body: ["Stripe の支払いを完了する前は、購入は確定しません。その手続きを閉じれば、代金は確定しません。"],
      },
      {
        heading: "利用権の付与後",
        body: [
          "AI Collections Assistant は、決済確認後に購入したアカウントへ利用権を付与するデジタル商品です。",
          "利用権の付与後は、お客様都合によるキャンセルおよび返金は原則としてお受けしません。",
        ],
      },
      {
        heading: "返金を確認する場合",
        body: [
          "同じ購入について代金が重複して請求された場合。",
          "システムの不具合により、購入した商品を提供できない場合。",
          "合理的な期間内に解消できない重大な不具合がある場合。",
          "適用される法令により、返金その他の対応が必要な場合。",
        ],
      },
      {
        heading: "返金の依頼",
        body: [
          `返金の依頼は ${KNOWN_SUPPORT_EMAIL} へ送ってください。`,
          "購入に使ったメールアドレスと、商品名を書いてください。",
        ],
      },
      {
        heading: "返金の方法",
        body: ["返金が認められる場合は、原則としてお支払いいただいた方法へ返します。"],
      },
      {
        heading: "返信の目安",
        body: [`ご連絡への返信は、${JAPAN_SUPPORT_RESPONSE}を目安とします。`],
      },
    ],
  },
};

export function legalDocument(slug: string): LegalDocument | null {
  if (slug === "tokusho" || slug === "terms" || slug === "privacy" || slug === "refund") {
    return legalDocuments[slug];
  }
  return null;
}

export function legalPlainText(): string {
  return Object.values(legalDocuments)
    .flatMap((document) => document.sections.flatMap((section) => [section.heading, ...section.body]))
    .join("\n");
}

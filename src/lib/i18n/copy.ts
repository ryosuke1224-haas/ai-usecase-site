import type { UiLocale } from "./locale";

export type PurchaseCopy = {
  oneTime: string;
  unavailable: string;
  signIn: string;
  buy: string;
  open: string;
  handoff: string;
};

export type CatalogLabels = {
  search: string;
  all: string;
  category: string;
  industry: string;
  functionLabel: string;
  dataSource: string;
  api: string;
  difficulty: string;
  automation: string;
  showing: (shown: number, total: number) => string;
  emptyTitle: string;
  clear: string;
};

export type SiteCopy = {
  nav: {
    businessAreas: string;
    blueprints: string;
    howItWorks: string;
    contact: string;
    resources: string;
    signIn: string;
    myBlueprints: string;
    signOut: string;
    signingOut: string;
  };
  footer: {
    summary: string;
    explore: string;
    resources: string;
    areas: string;
    tagline: string;
    legal: string;
    tokusho: string;
    terms: string;
    privacy: string;
    refund: string;
  };
  home: {
    eyebrow: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    areasTitle: string;
    areasBody: string;
    stepsTitle: string;
    steps: readonly { title: string; description: string }[];
    toolsPrompt: string;
    toolsLink: string;
    contentNote: string;
  };
  catalog: {
    eyebrow: (count: number) => string;
    title: string;
    body: string;
    contentNote: string;
    labels: CatalogLabels;
  };
  collections: {
    eyebrow: string;
    title: string;
    body: string;
    labelsTitle: string;
    confirmed: string;
    interpretation: string;
    recommended: string;
    fictional: string;
    demoNote: string;
  };
  purchase: PurchaseCopy;
  auth: {
    eyebrow: string;
    heading: string;
    description: string;
    starterEyebrow: string;
    starterHeading: string;
    starterDescription: string;
    expired: string;
    email: string;
    placeholder: string;
    continue: string;
    sending: string;
    sentTitle: string;
    sentLead: string;
    sentTail: string;
    differentEmail: string;
    emptyEmail: string;
    sendFailed: string;
    freeAccount: string;
    sameEmail: string;
  };
  blueprints: {
    title: string;
    body: string;
    signedIn: (email: string) => string;
    unlocked: string;
    locked: string;
    openStarter: string;
    openBlueprint: string;
    purchase: string;
    empty: string;
    freeNote: string;
  };
  success: {
    title: string;
    body: string;
    confirmed: string;
    open: string;
    pending: string;
    again: string;
  };
  kit: {
    lockedEyebrow: string;
    lockedTitle: string;
    lockedBody: string;
    back: string;
    openEyebrow: string;
    openTitle: string;
    openBody: string;
    englishNote: string;
  };
  contact: {
    title: string;
    body: string;
    purchase: string;
    purchaseBody: string;
    product: string;
    productBody: string;
    emailLabel: string;
    response: string;
  };
};

const englishCatalogLabels: CatalogLabels = {
  search: "Search use cases...",
  all: "All",
  category: "Category",
  industry: "Industry",
  functionLabel: "Function",
  dataSource: "Data source",
  api: "API",
  difficulty: "Difficulty",
  automation: "Automation",
  showing: (shown, total) => `Showing ${shown} of ${total} blueprints`,
  emptyTitle: "No blueprints match your filters",
  clear: "Clear all filters",
};

const english: SiteCopy = {
  nav: {
    businessAreas: "Business Areas",
    blueprints: "AI Blueprints",
    howItWorks: "How It Works",
    contact: "Contact",
    resources: "Resources",
    signIn: "Sign in",
    myBlueprints: "My Blueprints",
    signOut: "Sign out",
    signingOut: "Signing out…",
  },
  footer: {
    summary:
      "Practical AI workflows for small businesses — organised by business area and process, with what each workflow does, what you need, and how to get started.",
    explore: "Explore",
    resources: "Resources",
    areas: "Business areas",
    tagline: "AI Use Case Atlas — Practical workflows for SMB operators",
    legal: "Legal",
    tokusho: "Specified commercial transactions",
    terms: "Terms",
    privacy: "Privacy",
    refund: "Refunds",
  },
  home: {
    eyebrow: "Practical AI workflows for small businesses",
    title: "See where AI can save time across your business",
    body: "Explore practical ways to reduce repetitive work, improve operations, and make better decisions across sales, marketing, finance, HR, customer service, and everyday administration.",
    primary: "Explore business areas",
    secondary: "Browse all AI blueprints",
    areasTitle: "Which part of your business do you want to improve?",
    areasBody: "Choose an area to explore common processes and practical AI workflows.",
    stepsTitle: "From everyday work to a practical AI workflow",
    steps: [
      { title: "Choose a business area", description: "Start with the part of your business you want to improve." },
      { title: "Explore common processes", description: "See where repetitive work, delays, or errors commonly occur." },
      {
        title: "Open a practical blueprint",
        description: "Learn what the workflow does, what you need, and how to start manually or automate it.",
      },
    ],
    toolsPrompt: "Already know which tools you use?",
    toolsLink: "Find workflows by tools",
    contentNote: "",
  },
  catalog: {
    eyebrow: (count) => `Reference · ${count} entries`,
    title: "Use Case Library",
    body: "Filter by tools you have, data you collect, or business type. Each entry includes a requirements checklist and build path comparison.",
    contentNote: "",
    labels: englishCatalogLabels,
  },
  collections: {
    eyebrow: "Private preview",
    title: "AI Collections Assistant",
    body: "A weekly collections queue that you review yourself. AI sets aside disputed, promised, and below-minimum invoices with a visible reason, matches each draft's tone to how overdue the invoice is, and reads your outcome log so the same invoice is not chased twice by mistake. You decide what is sent, and you send it.",
    labelsTitle: "How labels are used in this demo",
    confirmed: "Stated in the export or your outcome log.",
    interpretation: "An inference by the AI, never presented as a fact.",
    recommended: "A suggestion. You decide whether it happens.",
    fictional: "The invoices in this demo are fictional. Nothing here is a real customer, and nothing is sent automatically.",
    demoNote: "",
  },
  purchase: {
    oneTime: "One-time access. Stripe confirms the payment before this Blueprint opens.",
    unavailable: "Premium payment is unavailable right now. Try again in a moment.",
    signIn: "Sign in to purchase",
    buy: "Buy Premium",
    open: "Open Premium Kit",
    handoff: "",
  },
  auth: {
    eyebrow: "Atlas account",
    heading: "Sign in to AI Use Case Atlas",
    description: "Enter your email to access your saved Blueprints and Starter Kits.",
    starterEyebrow: "Free Atlas account",
    starterHeading: "Get your free Starter Kit",
    starterDescription:
      "Create a free Atlas account to access the Daily Inbox Briefing Starter Kit and save it to My Blueprints.",
    expired: "That sign-in link is invalid or has expired. Enter your email to receive a new one.",
    email: "Email",
    placeholder: "you@company.com",
    continue: "Continue with Email",
    sending: "Sending link…",
    sentTitle: "Check your email",
    sentLead: "We sent a sign-in link to ",
    sentTail: ". Open it to finish signing in and unlock your Starter Kit.",
    differentEmail: "Use a different email",
    emptyEmail: "Enter your email address to continue.",
    sendFailed: "We could not send the sign-in email. Check that Supabase is configured, then try again.",
    freeAccount: "Free account. No credit card required.",
    sameEmail: "Already have an account? Use the same email — we'll send a sign-in link.",
  },
  blueprints: {
    title: "My Blueprints",
    body: "Free Starter Kits stay unlocked. Paid blueprints stay locked until a confirmed payment is recorded for your account.",
    signedIn: (email) => `Signed in as ${email}`,
    unlocked: "Unlocked",
    locked: "Locked",
    openStarter: "Open Starter Kit",
    openBlueprint: "Open Blueprint",
    purchase: "Available to purchase",
    empty: "No blueprints are unlocked yet.",
    freeNote: "Daily Inbox Briefing stays free for every signed-in account.",
  },
  success: {
    title: "Payment received.",
    body: "We're confirming access to your Premium Blueprint.",
    confirmed: "Access is confirmed.",
    open: "Open Blueprint",
    pending: "Access is not confirmed yet. This page does not unlock the Blueprint.",
    again: "Check again",
  },
  kit: {
    lockedEyebrow: "Premium · Private preview",
    lockedTitle: "Premium is locked",
    lockedBody: "Your Atlas account is signed in. This Blueprint opens after Stripe confirms a one-time payment for this account.",
    back: "Back to the guided demo",
    openEyebrow: "Premium · Private preview",
    openTitle: "AI Collections Assistant Premium Kit",
    openBody: "Prompts, a worksheet, and checklists for the weekly collections queue. You check every number and send from your own email. Nothing is sent automatically.",
    englishNote: "",
  },
  contact: {
    title: "Contact",
    body: "Questions about a Blueprint, a purchase, or a correction can come to the address below.",
    purchase: "Purchases and access",
    purchaseBody: "If a paid Blueprint does not open after Stripe confirms payment, include the email on the account.",
    product: "Product questions",
    productBody: "AI Use Case Atlas publishes practical AI workflows. AI Collections Assistant is the premium collections blueprint.",
    emailLabel: "Email",
    response: "",
  },
};

const japanese: SiteCopy = {
  nav: {
    businessAreas: "業務から探す",
    blueprints: "AI活用テンプレート",
    howItWorks: "使い方",
    contact: "お問い合わせ",
    resources: "リソース",
    signIn: "ログイン",
    myBlueprints: "マイテンプレート",
    signOut: "ログアウト",
    signingOut: "ログアウトしています…",
  },
  footer: {
    summary: "中小企業の業務で使えるAI活用例やテンプレートを、営業、マーケティング、経理、顧客対応などの業務別に紹介しています。",
    explore: "探す",
    resources: "リソース",
    areas: "業務領域",
    tagline: "AI Use Case Atlas",
    legal: "サポート・法務",
    tokusho: "特定商取引法に基づく表記",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    refund: "返金・キャンセルポリシー",
  },
  home: {
    eyebrow: "中小企業のための実践的なAI活用",
    title: "AIで、日々の業務をもっと効率的に。",
    body: "営業、マーケティング、経理、顧客対応など、日々の業務でAIをどう使えばよいかを、すぐ試せる手順とテンプレートにまとめています。",
    primary: "業務から探す",
    secondary: "AI活用テンプレートを見る",
    areasTitle: "どの業務から見ますか",
    areasBody: "気になる業務を選ぶと、その仕事でAIをどう使うかの例が並びます。",
    stepsTitle: "使い方",
    steps: [
      { title: "見つける", description: "改善したい業務を選びます。" },
      { title: "試す", description: "必要なデータやツール、具体的な手順を確認します。" },
      { title: "活用する", description: "テンプレートを使って、実際の業務でAIを試します。" },
    ],
    toolsPrompt: "使っているツールから探したいときは、",
    toolsLink: "ツールから探す",
    contentNote: "",
  },
  catalog: {
    eyebrow: (count) => `${count}件`,
    title: "AI活用テンプレート",
    body: "業務、業種、持っているデータから、試せる手順を絞り込めます。",
    contentNote: "",
    labels: {
      search: "AI活用例を探す",
      all: "すべて",
      category: "分類",
      industry: "業種",
      functionLabel: "業務の種類",
      dataSource: "データ",
      api: "ツール",
      difficulty: "難易度",
      automation: "進め方",
      showing: (shown, total) => `${total}件中 ${shown}件`,
      emptyTitle: "条件に合うAI活用例がありません",
      clear: "条件をクリア",
    },
  },
  collections: {
    eyebrow: "プレミアムAI活用テンプレート",
    title: "AI Collections Assistant",
    body: "入金が遅れている請求を整理し、誰に・どのようなフォローをするかを判断するためのAI活用テンプレートです。",
    labelsTitle: "情報の分け方",
    confirmed: "請求データや対応記録に記載されている内容です。",
    interpretation: "AIが内容を読み取り、分類した結果です。重要な内容は人が確認します。",
    recommended: "次に取る対応の候補です。実行するかどうかは人が判断します。",
    fictional: "画面の請求例は架空です。メールは自動では送りません。",
    demoNote: "",
  },
  purchase: {
    oneTime: "4,900円の買い切りです。この金額が、AI Use Case Atlas を通じてお支払いいただく代金です。",
    unavailable: "いま購入手続きを開始できません。しばらくしてからもう一度お試しください。",
    signIn: "ログインして購入",
    buy: "購入する",
    open: "テンプレートを開く",
    handoff: "このあと Stripe の支払い画面へ進みます。カード番号は AI Use Case Atlas では預かりません。",
  },
  auth: {
    eyebrow: "アカウント",
    heading: "ログイン",
    description: "メールアドレスに届くリンクから、保存したテンプレートを開けます。",
    starterEyebrow: "無料",
    starterHeading: "無料テンプレートを受け取る",
    starterDescription: "アカウントを作ると、受信メールを整理する無料テンプレートをマイテンプレートに追加できます。",
    expired: "ログイン用のリンクが無効か、期限が切れています。メールアドレスを入力して、新しいリンクを受け取ってください。",
    email: "メールアドレス",
    placeholder: "you@example.co.jp",
    continue: "ログイン用リンクを送る",
    sending: "送信しています…",
    sentTitle: "メールをご確認ください",
    sentLead: "",
    sentTail: " にログイン用のリンクを送りました。",
    differentEmail: "別のメールアドレスを使う",
    emptyEmail: "メールアドレスを入力してください。",
    sendFailed: "メールを送れませんでした。しばらくしてからもう一度お試しください。",
    freeAccount: "アカウントの作成は無料です。",
    sameEmail: "すでにアカウントがある場合も、同じメールアドレスでリンクを受け取れます。",
  },
  blueprints: {
    title: "マイテンプレート",
    body: "無料のテンプレートは、ログイン後すぐに使えます。有料のテンプレートは、お支払いの確認後に開きます。",
    signedIn: (email) => `${email} でログイン中`,
    unlocked: "利用可能",
    locked: "未購入",
    openStarter: "無料テンプレートを開く",
    openBlueprint: "テンプレートを開く",
    purchase: "購入する",
    empty: "表示できるテンプレートはまだありません。",
    freeNote: "受信メールの整理テンプレートは、ログインすれば無料で使えます。",
  },
  success: {
    title: "アクセスを確認中",
    body: "お支払いの確認が取れると、テンプレートを開けます。",
    confirmed: "購入が確認できました。",
    open: "テンプレートを開く",
    pending: "まだ購入を確認できていません。この画面ではテンプレートは開きません。",
    again: "もう一度確認する",
  },
  kit: {
    lockedEyebrow: "プレミアム",
    lockedTitle: "未購入",
    lockedBody: "ログインはできています。買い切りのお支払いが確認できると、このテンプレートを開けます。",
    back: "案内に戻る",
    openEyebrow: "プレミアム",
    openTitle: "AI Collections Assistant",
    openBody: "入金確認に使うプロンプト、シート、確認リストです。数字の確認と送信は人が行います。",
    englishNote: "",
  },
  contact: {
    title: "お問い合わせ",
    body: "購入、テンプレートの開き方、内容についての連絡先です。",
    purchase: "購入後に開かないとき",
    purchaseBody: "ログインに使ったメールアドレスを書いて送ってください。",
    product: "テンプレートについて",
    productBody: "AI Collections Assistantは、未回収・入金遅延の請求を整理し、フォローアップを支援するAI活用テンプレートです。代金は 4,900円 の買い切りです。",
    emailLabel: "メール",
    response: "原則3営業日以内",
  },
};

export function siteCopy(locale: UiLocale): SiteCopy {
  return locale === "ja" ? japanese : english;
}

export const englishSiteCopy = english;

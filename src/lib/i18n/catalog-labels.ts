const labels: Record<string, string> = {
  Beginner: "入門",
  Intermediate: "中級",
  Advanced: "上級",
  "Manual trigger": "手動",
  "Semi-automated": "一部自動",
  "Fully automated": "自動",
  High: "効果大",
  Medium: "効果中",
  Emerging: "これから",
  "Sales & Lead Generation": "営業・見込み客",
  Operations: "業務運営",
  "Finance & Planning": "経理・計画",
  Marketing: "マーケティング",
  "Customer Service": "顧客対応",
  Sales: "営業",
  Reputation: "口コミ",
  "Customer Success": "顧客フォロー",
  "HR & Training": "人事・研修",
  "B2B Services": "法人サービス",
  Agencies: "代理店",
  SaaS: "SaaS",
  "Professional Services": "専門サービス",
  "Any SMB": "中小企業全般",
  Contractors: "建設・工事",
  Freelancers: "個人事業",
  Salons: "サロン",
  Salon: "サロン",
  Fitness: "フィットネス",
  Healthcare: "医療",
  Consulting: "コンサルティング",
  "Home Services": "住宅サービス",
  Restaurant: "飲食",
  Restaurants: "飲食",
  "Local Services": "地域サービス",
  Clinic: "クリニック",
  Retail: "小売",
  Hospitality: "宿泊・接客",
  "E-commerce": "EC",
  B2B: "法人営業",
  "B2B Sales": "法人営業",
  Franchises: "フランチャイズ",
  "Food Service": "飲食",
  "Any growing SMB": "成長中の中小企業",
  Legal: "法律",
  "Local Retail": "地域の小売",
  Manufacturing: "製造",
  Services: "サービス業",
  "Business Development": "新規開拓",
  "Owner/Admin": "経営・管理",
  Finance: "経理",
  Scheduling: "予約・日程",
  Payroll: "給与",
  Planning: "計画",
  "Social Media": "SNS",
  Training: "研修",
  Revenue: "売上",
  SEO: "検索対策",
  HR: "人事",
  "Bank Transactions": "入出金",
  "Booking Data": "予約",
  "Budget Files": "予算",
  "Business Websites": "会社サイト",
  "Calendar Events": "予定",
  "Call Notes": "通話メモ",
  "Call Transcripts": "通話記録",
  "Chat Logs": "チャット",
  "Credit Card Transactions": "カード明細",
  "CRM Records": "顧客管理データ",
  "Customer List": "顧客名簿",
  "Customer Records": "顧客情報",
  "Customer Reviews": "口コミ",
  "Documents and PDFs": "書類・PDF",
  Emails: "メール",
  "Fixed Costs": "固定費",
  "GA4 Reports": "アクセス解析",
  "Google Ads Reports": "広告レポート",
  "Industry Directories": "業界名簿",
  Invoices: "請求書",
  "Lead Forms": "問い合わせフォーム",
  "LinkedIn Profiles": "LinkedInプロフィール",
  "LinkedIn Sales Navigator": "LinkedIn Sales Navigator",
  "Payroll Records": "給与データ",
  "POS Transactions": "レジ売上",
  "Proposal History": "提案履歴",
  "Public Business Listings": "公開されている店舗情報",
  "Sales Activity Logs": "営業活動の記録",
  "Sales History": "売上履歴",
  "Social Media Comments": "SNSのコメント",
  Spreadsheets: "表計算",
  "Staff Notes": "従業員メモ",
  "Staff Schedules": "シフト",
  "Support Tickets": "問い合わせ票",
  "Time Tracking Data": "勤怠",
  "TripAdvisor Listings": "TripAdvisor",
  "Website Form Submissions": "サイトのフォーム",
};

const useCases: Record<string, { title: string; summary: string }> = {
  "ai-account-research-assistant": {
    title: "取引先リサーチ",
    summary: "サイトや口コミ、公開情報から、商談前に読む短い調査メモを作ります。",
  },
  "ai-admin-organizer": {
    title: "メールからのタスク整理",
    summary: "メールに埋もれた依頼を抜き出し、管理表の行に落とします。",
  },
  "ai-booking-optimizer": {
    title: "予約の空き改善",
    summary: "予約の偏りを見て、空き時間と次の準備を整理します。",
  },
  "ai-break-even-dashboard": {
    title: "損益分岐の確認",
    summary: "月の固定費をまかなう売上と、目標利益までの差を出します。",
  },
  "ai-budget-variance-explainer": {
    title: "予算との差の説明",
    summary: "予算と実績の差を、売上・人件費・経費に分けて言葉で説明します。",
  },
  "ai-cash-flow-forecaster": {
    title: "資金繰りの見通し",
    summary: "請求、給与、固定費から、30日・60日・90日の現金の過不足を見ます。",
  },
  "ai-collections-assistant": {
    title: "AI Collections Assistant",
    summary: "遅れている請求に優先順位をつけ、送る文面の下書きまで作ります。送信は人が決めます。",
  },
  "ai-content-calendar": {
    title: "投稿カレンダー",
    summary: "お店の口コミや季節に合わせて、1か月分の投稿案を作ります。",
  },
  "ai-crm-deduplication-enrichment": {
    title: "見込み客の重複整理",
    summary: "新しい問い合わせを既存の顧客データと突き合わせ、重複と不足項目を整えます。",
  },
  "ai-crm-hygiene-monitor": {
    title: "顧客データの点検",
    summary: "放置された見込み客、空欄、次の予定がない商談を洗い出します。",
  },
  "ai-customer-response-assistant": {
    title: "問い合わせ返信の下書き",
    summary: "メールやフォームの問い合わせに、送る前に確認できる返信文を作ります。",
  },
  "ai-daily-inbox-briefing": {
    title: "朝の受信箱まとめ",
    summary: "急ぐメール、返事待ち、予定の重なりを短くまとめて朝の確認を減らします。",
  },
  "ai-expense-watchdog": {
    title: "経費の見落とし確認",
    summary: "急に増えた支払い、重複している契約、削れそうな費用を拾います。",
  },
  "ai-follow-up-engine": {
    title: "フォロー漏れの確認",
    summary: "返事が止まっている商談を見つけ、前回の内容に沿った文面を下書きします。",
  },
  "ai-hiring-affordability-planner": {
    title: "採用できるかの試算",
    summary: "人を一人増やすときに必要な売上と、売れなかった場合の負担を見ます。",
  },
  "ai-lead-scoring-engine": {
    title: "見込み客の優先順位",
    summary: "業種、規模、反応、過去のやり取りから、先に連絡する相手を並べます。",
  },
  "ai-local-lead-finder": {
    title: "近くの見込み客探し",
    summary: "公開されている店舗情報や口コミから、条件に近い会社を探します。",
  },
  "ai-meeting-prep-assistant": {
    title: "商談前の1枚メモ",
    summary: "これまでのやり取りと未完了の項目を、打ち合わせ前の1枚にまとめます。",
  },
  "ai-nurture-sequence-builder": {
    title: "フォローメールの流れ",
    summary: "相手の課題に合わせて、数回に分けて送る文面の流れを作ります。",
  },
  "ai-payroll-forecasting": {
    title: "人件費の見通し",
    summary: "シフトと売上見込みから、次の人件費と売上に対する割合を見ます。",
  },
  "ai-personalized-outreach-writer": {
    title: "個別の営業文面",
    summary: "公開情報と口コミから、相手ごとに違う営業メールの下書きを作ります。",
  },
  "ai-pipeline-risk-detector": {
    title: "止まりそうな商談",
    summary: "動きが止まった商談を、経過日数と連絡の有無から見つけます。",
  },
  "ai-pricing-impact-simulator": {
    title: "値上げの影響",
    summary: "価格を変えたときの売上と、離れそうな顧客の影響を先に試算します。",
  },
  "ai-proposal-follow-up-assistant": {
    title: "提案後のフォロー",
    summary: "返事がない見積や提案を見つけ、内容に沿った再連絡の文面を作ります。",
  },
  "ai-revenue-scenario-planner": {
    title: "売上のシミュレーション",
    summary: "価格、客数、人件費、広告費を変えたときの売上と利益を比べます。",
  },
  "ai-review-intelligence": {
    title: "口コミの傾向",
    summary: "Google や Yelp の口コミから、繰り返し出る評価と競合との差をまとめます。",
  },
  "ai-review-response-assistant": {
    title: "口コミ返信の下書き",
    summary: "新しい口コミへの返信文を作り、公開前に人が確認します。",
  },
  "ai-sales-briefing": {
    title: "商談前の要点",
    summary: "会社情報、口コミ、過去のメールから、聞くことと話すべき点を短くします。",
  },
  "ai-sop-builder": {
    title: "手順書づくり",
    summary: "手元の資料やメモから、現場がそのまま使える手順に整えます。",
  },
  "ai-staffing-optimizer": {
    title: "シフトと需要の調整",
    summary: "予約、売上、勤務時間を比べ、人が多すぎる時間と足りない時間を見ます。",
  },
  "google-ads-performance-coach": {
    title: "Google Ads の見直し",
    summary: "広告とアクセス解析の書き出しから、数字の確認と次にやることを分けます。",
  },
  "inactive-customer-winback": {
    title: "久々のお客様への再案内",
    summary: "しばらく来ていないお客様を見つけ、再来を案内する文面を作ります。",
  },
  "local-seo-content-assistant": {
    title: "地域向けのページ原稿",
    summary: "口コミで使われている言葉を使い、地域のサービスページやFAQの下書きを作ります。",
  },
  "no-show-recovery-assistant": {
    title: "無断キャンセルの再予約",
    summary: "来なかった予約を見つけ、翌日までに再予約を案内する文面を作ります。",
  },
  "quote-request-assistant": {
    title: "見積依頼の整理",
    summary: "フォームやメールの見積依頼から、条件を抜き出して最初の返事を下書きします。",
  },
  "staff-training-assistant": {
    title: "新人向けの確認問題",
    summary: "手順書をもとに、入社初日に使える確認問題と質問の答えを作ります。",
  },
  "weekly-owner-briefing": {
    title: "週次の経営メモ",
    summary: "売上、未入金、商談の状態を、金曜に読める短い文章にまとめます。",
  },
};

export function japaneseCatalogLabel(value: string): string {
  return labels[value] ?? value;
}

export function hasJapaneseCatalogLabel(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(labels, value);
}

export function japaneseUseCase(slug: string): { title: string; summary: string } | undefined {
  return useCases[slug];
}

export const japaneseUseCaseSlugs = Object.keys(useCases);

import type { BusinessArea } from "@/src/lib/business-areas";

export type JapaneseBusinessArea = {
  slug: BusinessArea;
  title: string;
  description: string;
  intro: string;
  processes: Record<string, string>;
};

export const japaneseBusinessAreas: JapaneseBusinessArea[] = [
  {
    slug: "sales",
    title: "営業",
    description: "見込み客管理、フォローアップ、提案書作成、商談管理、売上予測など",
    intro: "返信が遅れたり、商談の記録が古くなったりすると、営業は止まりやすくなります。見込み客の整理から提案まで、手元の情報で進められる手順をまとめています。",
    processes: {
      "Lead Capture & Qualification": "見込み客の受付と見極め",
      "Follow-Up & Outreach": "フォローアップ",
      "CRM & Pipeline Management": "商談管理",
      Quotes: "見積と提案",
      "Quotes & Proposals": "見積と提案",
      "Sales Forecasting": "売上予測",
    },
  },
  {
    slug: "marketing",
    title: "マーケティング",
    description: "広告運用、コンテンツ作成、口コミ分析、顧客インサイト、レポート作成など",
    intro: "発信、広告、口コミ、レポートが同時に進むと、何から手を付けるかが曖昧になります。今ある素材と数字から、次の一手を決める手順です。",
    processes: {
      Advertising: "広告運用",
      "Content Planning & Creation": "コンテンツ作成",
      "SEO & Local Search": "検索と地域からの流入",
      "Reviews & Reputation": "口コミと評判",
      "Campaign Reporting": "施策のレポート",
      "Customer Insights": "顧客インサイト",
    },
  },
  {
    slug: "customer-service",
    title: "顧客対応",
    description: "問い合わせ整理、返信文作成、FAQ、エスカレーション、顧客フィードバック分析など",
    intro: "問い合わせが増えると、返信の速さと内容のばらつきが問題になります。先に仕分けし、人が確認してから返すための手順です。",
    processes: {
      "Inbox & Ticket Triage": "問い合わせの整理",
      "Response Drafting": "返信文の作成",
      "FAQ & Self-Service": "FAQ",
      "Escalation Management": "エスカレーション",
      "Feedback Analysis": "顧客フィードバック分析",
    },
  },
  {
    slug: "operations",
    title: "業務運営",
    description: "スケジュール、在庫、受発注、人員配置、取引先管理、定期レポートなど",
    intro: "予定、在庫、発注、人員が別々に動くと、現場の判断が遅れます。毎週繰り返す確認を、短い手順に分けています。",
    processes: {
      Scheduling: "スケジュール",
      Inventory: "在庫",
      "Order Management": "受発注",
      "Staffing & Capacity": "人員配置",
      "Vendor Management": "取引先管理",
      "Operational Reporting": "定期レポート",
    },
  },
  {
    slug: "finance-accounting",
    title: "経理・財務",
    description: "請求書、経費、買掛金、キャッシュフロー、予算管理、財務レポートなど",
    intro: "入金、支払、経費の遅れは、あとからまとめて見ると原因が分かりにくくなります。数字を早めに確認するための手順です。",
    processes: {
      "Invoicing & Accounts Receivable": "請求と入金",
      "Accounts Payable": "買掛金",
      "Expense Management": "経費",
      "Cash-Flow Planning": "キャッシュフロー",
      Budgeting: "予算管理",
      "Financial Reporting": "財務レポート",
    },
  },
  {
    slug: "people-hr",
    title: "人事・労務",
    description: "採用、オンボーディング、勤怠、給与準備、研修、従業員対応など",
    intro: "採用や勤怠の進め方が担当者の記憶だけにあると、引き継ぎのたびに手間が増えます。必要な確認を手順として残します。",
    processes: {
      Recruiting: "採用",
      "Employee Onboarding": "オンボーディング",
      "Time & Attendance": "勤怠",
      "Payroll Preparation": "給与準備",
      "Employee Support": "従業員対応",
      "Training & Performance": "研修と評価",
    },
  },
  {
    slug: "administration",
    title: "総務・管理",
    description: "メール対応、データ入力、書類処理、会議後のフォロー、承認、表計算管理など",
    intro: "メール、転記、会議のあと始末は急がないまま溜まります。読む、直す、残すを分けて、毎日の処理を軽くします。",
    processes: {
      "Email & Inbox Management": "メール対応",
      "Data Entry": "データ入力",
      "Document Processing": "書類処理",
      "Meeting Follow-Up": "会議後のフォロー",
      Approvals: "承認",
      "Spreadsheet Maintenance": "表計算管理",
    },
  },
];

const bySlug = new Map(japaneseBusinessAreas.map((area) => [area.slug, area]));

export function japaneseBusinessArea(slug: string): JapaneseBusinessArea | undefined {
  return bySlug.get(slug as BusinessArea);
}

export function japaneseProcessName(slug: string, process: string): string {
  return japaneseBusinessArea(slug)?.processes[process] ?? process;
}

export function japaneseExampleCount(count: number): string {
  return `${count}件のAI活用例`;
}

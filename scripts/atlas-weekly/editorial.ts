import {
  buildResearchBrief,
  classifySourceRole,
  hasResearchSynthesis,
  researchQuestionFor,
  supportingSourcesRelevant,
  weakSupportingUrls,
  type SourceRole,
} from "./research-depth";
import type { BlogDraft, SourceRecord, WeeklyCategory } from "./types";

export const SOURCE_GROUPS = ["labs", "enterprise", "us-tech", "developer", "official"] as const;
export type SourceGroup = (typeof SOURCE_GROUPS)[number];

export const EDITORIAL_FOCUSES = ["ai-news", "us-tech", "ai-at-work", "enterprise"] as const;
export type EditorialFocus = (typeof EDITORIAL_FOCUSES)[number];

const GROUP_BY_PUBLISHER: Record<string, SourceGroup> = {
  openai: "labs",
  anthropic: "labs",
  google: "labs",
  meta: "labs",
  microsoft: "enterprise",
  salesforce: "enterprise",
  databricks: "enterprise",
  aws: "enterprise",
  reuters: "us-tech",
  techcrunch: "us-tech",
  "the verge": "us-tech",
  "ars technica": "us-tech",
  vercel: "developer",
  cursor: "developer",
  nist: "official",
};

const LOW_VALUE = [
  /ai gateway/i,
  /now available/i,
  /available on/i,
  /%\s*off/i,
  /percent off/i,
  /changelog/i,
  /\bsdk\b/i,
  /minor (?:release|update|fix)/i,
  /pricing (?:update|change|promotion)/i,
  /limited[- ]time/i,
  /generally available/i,
  /is now supported/i,
  /利用可能になり/,
  /％オフ/,
];

const ANNOUNCEMENT_TITLE = /利用可能|が追加|を発表|新機能を公開|％オフ|%オフ|ai gateway/i;

/** Reader-facing articles must never explain Atlas generation or editorial process. */
const META_LANGUAGE = [
  /発表の見出しや製品の宣伝文は、この記事の構成にしていません/,
  /Atlasの記事が足すのは/,
  /読者が得るのは、元の発表を短くしたものではなく/,
  /見出しの言い換えではなく/,
  /言い換えではなく/,
  /この記事では勧めていません/,
  /記事の構成にして/,
  /記事の基準です/,
  /生成した|生成プロセス|編集方針|内部QA|QAで/,
  /要約ではない|まとめ直しただけではない|翻訳しただけ/,
  /どのように書いたか|どう変換したか|どう構成したか/,
  /this article is not a summary/i,
  /source headlines were not copied/i,
];

const GENERIC_PHRASES = [
  /AIを活用できます/,
  /生産性が向上します/,
  /最新機能を確認しましょう/,
  /どの一段を任せるかが重要/,
  /どこを任せるかが問われ/,
];

const FAKE_FIRST_PERSON = [
  /私も使ってみました/,
  /私も試しました/,
  /実際に試したところ/,
  /自分の会社では/,
  /私の仕事では/,
  /個人的に使っていて/,
  /私が使った/,
  /私は試した/,
  /自分で検証した/,
];

const CONSULTING_PROSE = [
  /実務の分岐点/,
  /運用上の可逆性/,
  /責任主体/,
  /業務適用可能性/,
  /実行フェーズ/,
  /価値提供/,
];

const GENERIC_ATLAS = [
  /AIを活用/,
  /生産性を上げ/,
  /最新機能を確認/,
  /うまく使いこな/,
  /積極的に導入/,
];

const ROLE_MARKERS = [
  "営業",
  "サポート",
  "経理",
  "開発",
  "マネージャー",
  "法務",
  "分析",
  "運用",
  "企画",
  "事務",
  "担当",
];

const GENERIC_TAKEAWAY = /生産性を上げる|うまく活用|積極的に使う|AIを導入する|効率化を進める|最新機能を確認/;

export function sourceGroup(publisher: string): SourceGroup {
  return GROUP_BY_PUBLISHER[publisher.trim().toLowerCase()] ?? "us-tech";
}

export function isLowValueNews(title: string, summary: string): boolean {
  const text = `${title} ${summary}`;
  return LOW_VALUE.some((pattern) => pattern.test(text));
}

export function editorialFocus(title: string, summary: string, group: SourceGroup): EditorialFocus {
  const text = `${title} ${summary}`.toLowerCase();
  if (/support|customer|reply|inbox|invoice|sales|workflow|manager|review/.test(text)) return "ai-at-work";
  if (group === "enterprise" || /governance|operating model|copilot|crm/.test(text)) return "enterprise";
  if (group === "us-tech" || group === "official" || /funding|startup|silicon|regulat|policy|antitrust/.test(text)) return "us-tech";
  return "ai-news";
}

export function storedCategory(focus: EditorialFocus): WeeklyCategory {
  if (focus === "us-tech") return "us-tech";
  if (focus === "ai-at-work" || focus === "enterprise") return "practical-ai";
  return "ai-news";
}

export type SourceProfile = {
  group: SourceGroup;
  focus: EditorialFocus;
  lowValue: boolean;
};

export function describeSource(source: Pick<SourceRecord, "title" | "summary" | "publisher">): SourceProfile {
  const group = sourceGroup(source.publisher);
  return {
    group,
    focus: editorialFocus(source.title, source.summary, group),
    lowValue: isLowValueNews(source.title, source.summary),
  };
}

type Topic = {
  id: string;
  test?: RegExp;
  focus: EditorialFocus;
  title: string;
  thesis: string;
  why: string;
  deepWorkflow: string;
  secondary: string;
  who: string;
  review: string;
  framework: string;
  takeaway: string;
};

const TOPIC: Topic[] = [
  {
    id: "customer-review",
    test: /support|customer|reply|inbox/,
    focus: "ai-at-work",
    title: "顧客への返信は、下書きと送信を分けておく",
    thesis: "ここが面白いところです。顧客対応で効くのは、文面の速さそのものより、送る前に一度止められるかどうかです。",
    why: "一次案が速く出るほど、確認なしで送ってしまうリスクも増えます。速く返すことと、間違った約束をしないことは、別の仕事です。",
    deepWorkflow: [
      "たとえばサポートなら、受信メールと返金ルールを渡す → AIが返信下書きを作る → 担当者が宛先・期日・約束範囲だけ確認する → 送信は人が押す、という流れが現実的です。",
    ].join(""),
    secondary: "営業でも同じで、見積の前提確認までは任せても、金額や納期の断定は人が足した方が安全です。",
    who: "同じ型の問い合わせが毎週ある窓口なら試しやすいです。例外ばかりで確認欄を書けない少人数窓口は、まだ急がなくていいと思います。",
    review: "顧客への送信、返金、個人情報の開示は人が決めます。社内のラベル付けだけなら、もう少し任せても構いません。",
    framework:
      "Atlasでは、返信案を速く作ることより、送信ボタンを人の手元に残す設計の方を重視しています。繰り返す問い合わせで、送る前に確認できるなら今から試してよい。確認なしで外に出る運用なら、まだ早いです。",
    takeaway:
      "明日なら、よく来る問い合わせを一件選んで、AIには返信案だけ作らせてみてください。宛先・期日・禁止表現だけ自分で見てから送る。それだけで、下書きと送信を分ける感覚がつかめます。",
  },
  {
    id: "invoice-review",
    test: /invoice|payment|overdue|collection/,
    focus: "ai-at-work",
    title: "未入金フォローは、候補づくりと送信を分ける",
    thesis: "請求フォローで効くのは、催促文の上手さより、今日見る案件を人が見逃さないことです。",
    why: "滞留は文章の質より抜け漏れで遅れます。一覧と送信判断を同じ操作にすると、関係を壊しやすい相手へも流れます。",
    deepWorkflow: [
      "たとえば経理なら、未入金一覧を渡す → AIが優先三件と催促下書きを作る → 担当者が金額と相手関係を確認する → 送る／保留は人が別操作で選ぶ、が使いやすいです。",
    ].join(""),
    secondary: "営業事務でも、未入金メモの整理までは任せて、電話する順番だけ人が決める形が現実的です。",
    who: "件数が多いチームなら試しやすいです。件数が少なく、相手事情が毎回違うなら、まだ手作業の方が速いこともあります。",
    review: "督促の送信、入金消込、値引き交渉は人が決めます。候補の並べ替えだけなら任せて構いません。",
    framework:
      "Atlasでは、催促文の自動化より、送る前に相手関係を見られるかの方が大事だと考えています。毎週候補が生まれ、保留に戻せるなら今試してよい。金額確認なしで自動送信する運用は避けた方がいいです。",
    takeaway:
      "明日なら、未入金一覧から三件だけ選んで、AIに文面下書きを作らせてみてください。送るか保留かは、自分で別の操作として決める。その感覚が分かれば十分です。",
  },
  {
    id: "long-work",
    test: /agent|long-running|workflow|hours|tasks?|spark|computer use/,
    focus: "ai-news",
    title: "チャットからタスク実行へ。買う・送る前で止める",
    thesis:
      "これは結構大きな変化です。これまでのAIは、基本的には『聞いたら答える』ものでした。Tasksはもう少し『これやっといて』に近い。",
    why: "ただ、全部任せればいいわけではありません。一問一答なら誤答は会話の中で直せます。裏で進む作業は、途中を見ないまま買う・送る・予約確定まで行くと取り返しがつきません。",
    deepWorkflow: [
      "実務で考えると、話はもう少しシンプルです。依頼条件を渡す → AIが調査や下書きを裏で進める → 候補や下書きを人が確認する → 支払い・送信・確定だけ人が押す。この一段を分けるだけで、かなり使いやすくなります。",
    ].join(""),
    secondary: "たとえば営業なら、商談メモの整理とフォロー候補まで任せて、顧客への送信は自分で残す。サポートも、過去対応の要点整理までは任せて、説明文の送信は人が押す形が現実的です。",
    who: "同じ型の調査や下書きが繰り返され、途中で確認できる人なら試しやすいです。確認者がいないまま常時接続する運用や、支払いと送信が同じボタンになっている場合は、まだ早いと思います。",
    review: "支払い、顧客送信、予約や契約の確定は人が決めます。候補集めや社内下書きは任せて構いません。",
    framework:
      "Atlasでは、今回の変化を『聞く』から『任せる』への寄りだと見ています。面白いのは無料になったこと以上に、途中成果を置いておける点です。ただ今すぐ全自動にする必要はありません。調査や下書きまで任せて、買う・送る前で人に返す。このくらいが今は一番使いやすいと思います。",
    takeaway:
      "明日なら、今週すでに何度かやった調査や下書きを一つ選んで、途中までAIに任せてみるのがいいです。最後の送信や確定だけ自分でやる。それだけでも、チャットとタスク実行の違いはかなり分かります。",
  },
  {
    id: "documents",
    test: /document|context|pdf|contract/,
    focus: "ai-at-work",
    title: "長い資料は、見る項目を先に決めてから渡す",
    thesis: "長い資料を一度に渡せるようになっても、効くのは全文要約より、人が見る箇所を先に絞ることです。",
    why: "全文を短くしただけでは、信じる数字と条件は決まりません。抜けた条件の方が高くつきます。",
    deepWorkflow: [
      "たとえば契約書なら、確認したい三項目を先に書く → AIが該当箇所の候補を示す → 担当者が原文に戻って確認する → 承認や送付は人が行う、が安全です。",
    ].join(""),
    secondary: "提案書でも同じで、約束事項を三項目に整理してから渡し、顧客説明の前に人が文言を確定した方が抜けが減ります。",
    who: "同じ形式の資料が毎週来る部署なら試しやすいです。毎回フォーマットが違うなら、先に確認項目を揃える方が先です。",
    review: "契約承認、価格確定、法的な解釈は人が決めます。該当ページの候補出しは任せて構いません。",
    framework:
      "Atlasでは、長い資料ほど『何を見るか』を先に決める方が大事だと考えています。確認項目を三つ書けるなら今試してよい。書けないなら、要約より観点整理が先です。",
    takeaway:
      "明日なら、長い資料を一件選んで、確認したい項目を三つ書いてからAIに該当箇所を探させてみてください。判断は原文に戻って行う。抜けが無かったかを一度見るだけで十分です。",
  },
  {
    id: "enterprise",
    test: /enterprise|governance|copilot|crm|operating/,
    focus: "enterprise",
    title: "企業のAIは、全社配布より既存手順の一段から",
    thesis: "企業でのAIは、試用デモから、誰がどの手順で使うかの話へ移っています。",
    why: "発表の規模より、毎週同じ入力と出力がある一段を切れるかが現場の変化です。一度うまくいっても、毎週の確認が残らなければ手順になりません。",
    deepWorkflow: [
      "たとえば営業マネージャーなら、商談メモを渡す → AIが次アクション候補を作る → 担当者が連絡文だけ確認する → 送信は人が行う、が始めやすいです。",
    ].join(""),
    secondary: "経理でも、科目候補まで任せて、金額と勘定科目の承認だけ人が見る形が現実的です。",
    who: "手順書があるチームなら試しやすいです。入力欄も承認者も書けない属人運用なら、先に一段を定義した方がいいです。",
    review: "顧客連絡、支払い承認、権限変更は人が決めます。社内の候補リスト作成は任せて構いません。",
    framework:
      "Atlasでは、全社展開の前に『毎週同じ一段』を切れるかを見ています。入力と承認者が言えるなら今試してよい。言えない導入計画は、機能配布より先に手順定義へ戻した方がいいと思います。",
    takeaway:
      "明日なら、チームで毎週起きている作業を一つ書き出して、AIが作るものとマネージャーが承認するものを分けてみてください。一週間その分担を守るだけで、向き不向きが見えます。",
  },
  {
    id: "us-tech",
    test: /funding|startup|silicon|san francisco|regulat|antitrust/,
    focus: "us-tech",
    title: "米国テックの動きは、自社の制約確認に落とす",
    thesis: "米国の技術や規制ニュースは、製品名を覚える材料というより、自社の仕事の制約が変わるかを見る材料です。",
    why: "資金や規制の話は、すぐ画面を変えるとは限りません。見るべきは、外部サービスの契約条件と、顧客へ説明できる範囲です。",
    deepWorkflow: [
      "たとえば事業担当なら、今回の公開要点と利用中サービス一覧を渡す → AIが影響しそうな項目候補を洗う → 担当者が契約やデータ条件を確認する → 手順を変えるかは人が決める、が現実的です。",
    ].join(""),
    secondary: "説明範囲が変わらないなら、営業文面まで毎週直す必要はありません。変わったときだけ直せば十分です。",
    who: "外部サービス依存が大きいチームなら確認の価値があります。自社完結だけでサービス一覧が無いなら、先に棚卸しです。",
    review: "契約変更の承認、顧客説明の確定、サービス停止判断は人が決めます。影響候補の洗い出しは任せて構いません。",
    framework:
      "Atlasでは、こうしたニュースを『今週すぐ手順を変える材料か』で見ています。契約やデータの扱いに触れるなら確認する。触れなければ、今週の手順はそのままでいいと思います。",
    takeaway:
      "明日なら、今使っている外部サービスを三つ書いて、今回の動きが契約条件かデータの扱いに触れるかだけ見てください。触れなければ、今週は手順を変えない。それで十分です。",
  },
];

const DEFAULT_TOPIC: Topic = {
  id: "work-shift",
  focus: "ai-news",
  title: "新しい発表は、繰り返す確認作業の前段に落とす",
  thesis: "重要なのは、新機能そのものより使い方です。毎週繰り返している確認・下書き・調査を、どこまで前段に出せるか。",
  why: "モデルやツールの更新だけでは、手順は変わりません。結果を見ない仕事は、速くなった分だけ誤りの確認が遅れます。",
  deepWorkflow: [
    "たとえば、今週すでに二度やった作業の素材を渡す → AIが初稿や整理案を作る → 担当者が事実と約束表現を確認する → 採用や送信は人が行う、が使いやすいです。",
  ].join(""),
  secondary: "開発なら調査メモの一次稿まで、サポートならFAQ候補まで任せて、採用や公開は人が決める形が現実的です。",
  who: "繰り返し作業があり、採用者が一人に決まるチームなら試しやすいです。毎回条件が違う例外作業は、まだ急がなくていいです。",
  review: "顧客向け送信、価格決定、本番反映は人が決めます。社内初稿は任せて構いません。",
  framework:
    "Atlasでは、発表を機能一覧として読まず、繰り返す確認の前段に落とせるかで見ています。確認者が決まっているなら今試してよい。決まっていない機能追加は、まだ待つ方がいいと思います。",
  takeaway:
    "明日なら、今週すでに二度以上やった作業を一つ選んで、AIには初稿だけ作らせてみてください。採用する人を一人決める。修正が減るかだけ見れば十分です。",
};

function topicFor(source: SourceRecord): Topic {
  const text = `${source.title} ${source.summary}`.toLowerCase();
  return TOPIC.find((item) => item.test?.test(text)) ?? DEFAULT_TOPIC;
}

function dateLabel(value: string | null): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return value.slice(0, 10);
}

function cleanText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number): string {
  const text = cleanText(value);
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function factFromSummary(source: SourceRecord): string {
  const lower = `${cleanText(source.title)} ${cleanText(source.summary)}`.toLowerCase();
  const bits: string[] = [];
  if (/tasks/.test(lower) && /gemini/.test(lower)) bits.push("GeminiのTasks");
  if (/\bfree\b|無料/.test(lower)) bits.push("無料での利用");
  if (/workspace/.test(lower)) bits.push("Google Workspace連携");
  if (/countries|u\.s\.|united states|米国/.test(lower)) bits.push("対象国・米国での展開");
  if (/agent/.test(lower)) bits.push("エージェント型の長めの作業");
  if (/support|customer|reply|inbox/.test(lower)) bits.push("顧客対応の返信確認");
  if (/invoice|payment|overdue|collection/.test(lower)) bits.push("請求・入金フォロー");
  if (/governance|enterprise|copilot|operating/.test(lower)) bits.push("企業内の運用・確認手順");
  if (bits.length >= 1) {
    return `${bits.join("、")}についての案内です。`;
  }
  return "公開ページに書かれた範囲の事実を前提にします。";
}

type SupportWithRole = {
  source: Pick<SourceRecord, "title" | "publisher" | "canonicalUrl">;
  role: SourceRole;
};

/**
 * One synthesis sentence for supporting sources.
 * Must follow the article's topic — never reuse the Gemini Tasks bridge for other stories.
 * Role labels stay internal; only natural Japanese prose is returned.
 */
export function synthesizeSupportBridge(topicId: string, supports: readonly SupportWithRole[]): string {
  if (supports.length === 0) return "";
  const related = supports
    .slice(0, 3)
    .map((item) => `${item.source.publisher}の「${clip(item.source.title, 50)}」`)
    .join("や");
  const hasCounter = supports.some((item) => item.role === "COUNTERPOINT");
  const hasDoc = supports.some((item) => item.role === "PRODUCT_DOC");

  switch (topicId) {
    case "long-work":
      if (hasCounter) {
        return `あわせて${related}も見ると、途中まで任せることと、買う・送る・確定の前で止めることが同じ話として重なります。`;
      }
      if (hasDoc) {
        return `あわせて${related}も見ると、個別の機能名より「聞いたら答える」から「途中まで進めてもらう」へ寄っている点が重なります。`;
      }
      return `あわせて${related}も見ると、チャット回答と、裏で進む作業を分ける見方が共通しています。`;
    case "customer-review":
      return hasCounter
        ? `あわせて${related}も見ると、下書きを速くすることより、外に出す前の確認を残す点が重なります。`
        : `あわせて${related}も見ると、返信案づくりと送信判断を分ける設計が共通しています。`;
    case "invoice-review":
      return `あわせて${related}も見ると、候補づくりと、実際に送る判断を分ける必要が共通しています。`;
    case "documents":
      return `あわせて${related}も見ると、全文要約より、先に見る項目を決める方が実務に効く点が重なります。`;
    case "enterprise":
      return `あわせて${related}も見ると、全社配布より、毎週同じ確認手順を一段切り出せるかが共通の論点です。`;
    case "us-tech":
      return `あわせて${related}も見ると、製品名の追跡より、自社の契約や説明範囲に触れるかの確認が先になります。`;
    default:
      return hasCounter
        ? `あわせて${related}も見ると、速く進めることより、人が止まれる位置を残す点が重なります。`
        : `あわせて${related}も見ると、機能一覧より、繰り返す確認の前段をどこまで出せるかが共通しています。`;
  }
}

/** True when a non-task article reused the Gemini Tasks chat→task synthesis bridge. */
export function hasMismatchedTaskSynthesis(body: string, source: SourceRecord): boolean {
  if (topicFor(source).id === "long-work") return false;
  return /聞いたら答える/.test(body) && /途中まで進めてもらう/.test(body);
}

/** Source-supported lead: publisher, timing, subject, plus topic-aware synthesis when supports exist. */
export function sourceFactLead(
  source: SourceRecord,
  support: readonly SourceRecord[] = [],
  options: {
    topicId?: string;
    roles?: ReadonlyArray<{ url: string; role: SourceRole }>;
  } = {},
): string {
  const published = dateLabel(source.publishedAt);
  const when = published ? `${published}に` : "";
  const subject = clip(source.title, 110);
  const primary = `${source.publisher}が${when}出した「${subject}」は、${factFromSummary(source)}`;
  if (support.length === 0) return primary;
  const topicId = options.topicId ?? topicFor(source).id;
  const roleByUrl = new Map((options.roles ?? []).map((item) => [item.url, item.role]));
  const withRoles: SupportWithRole[] = support.slice(0, 3).map((item) => ({
    source: item,
    role: roleByUrl.get(item.canonicalUrl) ?? classifySourceRole(source, item),
  }));
  return `${primary}${synthesizeSupportBridge(topicId, withRoles)}`;
}

export function editorialArticle(source: SourceRecord, support: readonly SourceRecord[] = []): {
  title: string;
  summary: string;
  body: string;
  focus: EditorialFocus;
  category: WeeklyCategory;
  sourceUrls: string[];
  researchQuestion: string;
} {
  const topic = topicFor(source);
  const profile = describeSource(source);
  const focus = topic.focus ?? profile.focus;
  const brief = buildResearchBrief(source, support.length > 0 ? [source, ...support] : [source], 3);
  const supportList = brief.supports.map((item) => item.source);
  const facts = sourceFactLead(source, supportList, {
    topicId: topic.id,
    roles: brief.supports.map((item) => ({ url: item.source.canonicalUrl, role: item.role })),
  });
  const links = [
    `[${source.publisher}](${source.canonicalUrl})`,
    ...supportList.map((item) => `[${item.publisher}](${item.canonicalUrl})`),
  ];
  const body = [
    facts,
    "",
    topic.thesis,
    "",
    topic.why,
    "",
    "## 仕事でどう使える？",
    "",
    topic.deepWorkflow,
    "",
    topic.secondary,
    "",
    topic.who,
    "",
    topic.review,
    "",
    "## Atlasの見方",
    "",
    topic.framework,
    "",
    "## 明日試すなら",
    "",
    topic.takeaway,
    "",
    "## 出典",
    "",
    ...links,
  ].filter((line) => line !== "").join("\n");
  return {
    title: topic.title,
    summary: topic.thesis,
    body,
    focus,
    category: storedCategory(focus),
    sourceUrls: [source.canonicalUrl, ...supportList.map((item) => item.canonicalUrl)],
    researchQuestion: brief.question || researchQuestionFor(source),
  };
}

export function titleRepeatsSource(title: string, sourceTitle: string): boolean {
  if (ANNOUNCEMENT_TITLE.test(title)) return true;
  const sourceTokens = sourceTitle.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3);
  if (sourceTokens.length === 0) return false;
  const titleTokens = new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3));
  const shared = sourceTokens.filter((token) => titleTokens.has(token)).length;
  return shared / sourceTokens.length >= 0.6;
}

export function paraphrasesSource(body: string, source: Pick<SourceRecord, "title" | "summary">): boolean {
  // Compare analysis sections only; the lead may name the source title as a fact.
  const idx = body.search(/##\s*仕事で/);
  const analysis = idx >= 0 ? body.slice(idx) : body;
  const summary = cleanText(source.summary);
  if (summary.length >= 40 && analysis.includes(summary.slice(0, 80))) return true;
  const distinctive = `${source.title} ${summary}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 5);
  if (distinctive.length < 4) return false;
  const bodyTokens = new Set(analysis.toLowerCase().split(/[^a-z0-9]+/));
  const shared = distinctive.filter((token) => bodyTokens.has(token)).length;
  return shared / distinctive.length >= 0.45;
}

export function hasMetaEditorialLanguage(body: string): boolean {
  return META_LANGUAGE.some((pattern) => pattern.test(body));
}

export function concreteRoleCount(body: string): number {
  return ROLE_MARKERS.filter((role) => body.includes(role)).length;
}

export function hasDeepWorkflow(body: string): boolean {
  const arrows = (body.match(/→/g) ?? []).length;
  if (arrows >= 2 && /(渡|依頼|入力)/.test(body) && /(確認|レビュー|承認)/.test(body) && /(送信|採用|購入|確定|人が|自分)/.test(body)) {
    return true;
  }
  return /(渡|依頼).{0,40}(進|作|整理).{0,40}(確認|見る).{0,40}(送信|購入|確定|押)/.test(body);
}

export function hasConcreteWorkflow(body: string): boolean {
  return hasDeepWorkflow(body);
}

export function hasSourceSpecificFacts(body: string, source: Pick<SourceRecord, "publisher" | "title" | "publishedAt">): boolean {
  if (!body.includes(source.publisher)) return false;
  if (!/(公開|出した|案内)/.test(body)) return false;
  const published = dateLabel(source.publishedAt);
  if (published && body.includes(published)) return true;
  const titleToken = cleanText(source.title).split(/[^a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf]+/).find((token) => token.length >= 4);
  if (titleToken && body.includes(titleToken.slice(0, Math.min(titleToken.length, 24)))) return true;
  return /「[^」]{4,}」/.test(body);
}

function atlasSection(body: string): string {
  return body.match(/##\s*Atlasの見方\s*\n+([\s\S]*?)(?=\n##\s|$)/)?.[1]?.trim() ?? "";
}

/** Labeled checklist dump in the public article — keep the axes internal. */
export function hasExcessiveFrameworkFormatting(body: string): boolean {
  const labeled = (body.match(/(頻度|入力|検証|可逆性|責任)\s*[:：]/g) ?? []).length;
  return labeled >= 3 || /判断は五つの軸/.test(body);
}

export function hasFabricatedFirstPerson(body: string): boolean {
  return FAKE_FIRST_PERSON.some((pattern) => pattern.test(body));
}

export function hasConsultingProse(body: string): boolean {
  return CONSULTING_PROSE.some((pattern) => pattern.test(body));
}

export function hasGenericAtlasConclusion(body: string): boolean {
  const section = atlasSection(body);
  if (!section) return true;
  if (GENERIC_ATLAS.some((pattern) => pattern.test(section))) return true;
  // A conclusion that never names a concrete action/topic is too reusable.
  if (!/(送|買|確認|待|試し|任|止|下書き|調査|返信|請求|資料|手順|Tasks|タスク)/.test(section)) return true;
  return false;
}

export function hasRepetitiveRoleListing(body: string): boolean {
  const listed = ROLE_MARKERS.filter((role) => new RegExp(`${role}(は|なら|でも|では)`).test(body)).length;
  return listed >= 4 && !hasDeepWorkflow(body);
}

/** Atlas judgment in prose — not a five-axis checklist dump. */
export function hasDecisionFramework(body: string): boolean {
  if (!body.includes("Atlasの見方")) return false;
  const section = atlasSection(body);
  if (section.length < 40) return false;
  if (hasExcessiveFrameworkFormatting(section)) return false;
  if (hasGenericAtlasConclusion(body)) return false;
  return /(今|試し|待つ|現実的|向いて|まだ|思います|見ています|大事|重視)/.test(section);
}

export function hasGenericTakeaway(body: string): boolean {
  const match = body.match(/##\s*明日試すなら\s*\n+([\s\S]*?)(?=\n##\s|$)/);
  const takeaway = match?.[1]?.trim() ?? "";
  if (!takeaway) return true;
  if (takeaway.length < 30) return true;
  if (GENERIC_TAKEAWAY.test(takeaway)) return true;
  if (!/(選|書|作|確認|比|残|決|保存|開|移|出|戻|止|分|直|見|任|試)/.test(takeaway)) return true;
  return false;
}

export function hasShallowGenericExamplesOnly(body: string): boolean {
  if (hasDeepWorkflow(body)) return false;
  return /下書き/.test(body) && /確認/.test(body) && concreteRoleCount(body) >= 2;
}

export function editorialFailures(
  blog: Pick<BlogDraft, "title" | "body" | "sourceUrls">,
  source: SourceRecord,
  research: readonly SourceRecord[] = [],
): string[] {
  const reasons: string[] = [];
  if (titleRepeatsSource(blog.title, source.title)) reasons.push("translated source title");
  if (paraphrasesSource(blog.body, source)) reasons.push("source paraphrase");
  // Substantive short articles may pass; reject only empty shells.
  if (!blog.body.includes("Atlasの見方") || blog.body.trim().length < 280) reasons.push("missing editorial thesis");
  if (!/仕事|営業|サポート|担当|管理|経理|顧客|手順/.test(blog.body)) reasons.push("missing work relevance");
  if (!/明日試すなら/.test(blog.body)) reasons.push("missing practical takeaway");
  if (!blog.sourceUrls.some((url) => url.startsWith("https://"))) reasons.push("missing source url");
  if (hasFabricatedFirstPerson(blog.body)) reasons.push("fabricated personal experience");
  if (hasMetaEditorialLanguage(blog.body)) reasons.push("meta editorial language");
  if (GENERIC_PHRASES.some((pattern) => pattern.test(blog.body))) reasons.push("generic phrasing");
  if (hasConsultingProse(blog.body)) reasons.push("consulting prose");
  if (hasExcessiveFrameworkFormatting(blog.body)) reasons.push("excessive framework formatting");
  if (hasGenericAtlasConclusion(blog.body)) reasons.push("generic Atlas conclusion");
  if (hasRepetitiveRoleListing(blog.body)) reasons.push("repetitive role listing");
  if (!hasSourceSpecificFacts(blog.body, source) && !source.evergreen) reasons.push("missing source-specific facts");
  if (!hasDeepWorkflow(blog.body) && concreteRoleCount(blog.body) < 1) reasons.push("missing concrete work examples");
  if (!hasDeepWorkflow(blog.body)) reasons.push("missing deep workflow");
  if (hasShallowGenericExamplesOnly(blog.body)) reasons.push("shallow generic examples");
  if (!hasDecisionFramework(blog.body)) reasons.push("missing decision framework");
  if (hasGenericTakeaway(blog.body)) reasons.push("generic practical takeaway");
  if (!source.evergreen && researchQuestionFor(source).trim().length < 12) reasons.push("missing research question");
  if (!hasResearchSynthesis(blog.body)) reasons.push("sources not synthesized");
  if (blog.sourceUrls.length >= 3 && !hasResearchSynthesis(blog.body)) reasons.push("source count without research depth");
  if (hasMismatchedTaskSynthesis(blog.body, source)) reasons.push("mismatched research synthesis");
  if (research.length > 0) {
    const weak = weakSupportingUrls(source, blog.sourceUrls, research);
    if (weak.length > 0) reasons.push("weak supporting source");
  }
  // Source attribution must survive voice edits.
  if (blog.sourceUrls.length > 0 && !/##\s*出典/.test(blog.body)) reasons.push("missing source attribution");
  // Internal source-role labels must never appear in public copy.
  if (/\b(PRIMARY_FACT|PRODUCT_DOC|SUPPORTING_EVIDENCE|CONTEXT|COUNTERPOINT)\b/.test(blog.body)) {
    reasons.push("exposed internal source role");
  }
  return reasons;
}

export function supportingSources(primary: SourceRecord, research: readonly SourceRecord[]): SourceRecord[] {
  return supportingSourcesRelevant(primary, research, 3);
}

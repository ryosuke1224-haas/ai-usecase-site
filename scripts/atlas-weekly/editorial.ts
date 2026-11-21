import {
  buildResearchBrief,
  hasResearchSynthesis,
  researchQuestionFor,
  supportingSourcesRelevant,
  weakSupportingUrls,
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
    title: "顧客への返信は、下書きと送信を分けて設計する",
    thesis: "顧客対応で実務の単位になっているのは、文面速度より、送る前に止める確認の置き方です。",
    why: "一次案が速く出るほど、確認なし送信のリスクも増えます。速く返すことと、間違った約束をしないことは別の仕事です。",
    deepWorkflow: [
      "サポート窓口の深い例: ",
      "入力は受信メール、顧客区分、返金可否の社内ルール → ",
      "AIが返信件名・依頼要約・返金可否欄つきの下書きを作る → ",
      "担当者が宛先、期日、禁止表現、約束範囲だけを確認する → ",
      "顧客への送信は人が押す。",
      "見る指標は、確認なし送信ゼロと、担当者が直す時間です。",
    ].join(""),
    secondary: [
      "営業は、見積前提の確認文だけを作り、金額と納期の断定は人が足します。",
      "経理連携の問い合わせでは、入金事実欄だけを埋め、値引き文言は人が決めます。",
      "マネージャーは、確認欄が空のまま送られた件数を週次で点検します。",
    ].join(""),
    who: "向いているのは、同じ型の問い合わせが毎週繰り返され窓口です。まだ向いていないのは、例外が大半で確認欄を三つ書けない少人数窓口です。",
    review: "顧客送信、返金、例外対応、個人情報の開示は人が残します。社内ラベル付けだけなら確認を軽くできます。",
    framework: [
      "判断は五つの軸で切ります。",
      "頻度: 同じ型が繰り返されるか。",
      "入力: 依頼文とルールがある程度揃っているか。",
      "検証: 人が送信前に結果を見られるか。",
      "可逆性: 外に出す前に止められるか。",
      "責任: 送信者が名前で残るか。",
      "五つ揃うなら今試せます。責任か可逆性が欠けるなら待ちます。",
    ].join(""),
    takeaway: "明日試すなら、繰り返し問い合わせを一件選び、AIには返信案だけを作らせ、宛先・期日・禁止表現の三欄を担当者が確認してから送信してください。一週間、確認なし送信がゼロかを数えます。",
  },
  {
    id: "invoice-review",
    test: /invoice|payment|overdue|collection/,
    focus: "ai-at-work",
    title: "未入金フォローは、候補づくりと送信判断を分ける",
    thesis: "請求フォローで効くのは、催促文の上手さより、今日見る案件を人が見逃さない仕組みです。",
    why: "滞留は文章品質より抜け漏れで遅れます。一覧と送信判断を同じ操作にすると、関係を壊しやすい相手へも流れます。",
    deepWorkflow: [
      "経理の深い例: ",
      "入力は未入金一覧、遅延日数、金額、相手区分 → ",
      "AIが優先三件と事実欄つき催促下書きを作る → ",
      "担当者が金額・相手関係・前回約束を確認する → ",
      "送る/保留は人が別操作で選ぶ。",
      "見る指標は、誤送信と、保留理由の再利用です。",
    ].join(""),
    secondary: [
      "営業事務は、取引先ごとの未入金メモを短く整理し、電話する順番だけを人が決めます。",
      "分析担当は滞留日数の偏りをまとめ、値引き判断には入りません。",
      "マネージャーは、止めた理由を週次で見て除外条件を更新します。",
    ].join(""),
    who: "向いているのは件数が多い経理・営業事務です。まだ向いていないのは、件数が少なく相手事情が毎回違う少人数運用です。",
    review: "督促送信、入金消込、値引き交渉は人が残します。候補の並べ替えだけなら自動化して構いません。",
    framework: [
      "頻度: 毎週候補が生まれるか。",
      "入力: 金額と遅延日が揃っているか。",
      "検証: 送信前に相手関係を見られるか。",
      "可逆性: 保留に戻せるか。",
      "責任: 送った人が残るか。",
      "金額確認欄が無い運用は止め、五つ揃うまで自動送信は繋ぎません。",
    ].join(""),
    takeaway: "明日試すなら、未入金一覧から三件だけ選び、AIに文面下書きを作らせ、送るか保留かは担当者が別操作で決めてください。一週間、誤送信と保留理由をメモします。",
  },
  {
    id: "long-work",
    test: /agent|long-running|workflow|hours|tasks?|spark|computer use/,
    focus: "ai-news",
    title: "チャットからタスク実行へ。買う・送る前で止める",
    thesis:
      "チャットは答えを返し、タスク実行は依頼を置いたまま複数ステップを進める。実務の分岐点は速さではなく、支払い・送信・予約変更の前に人が止められるかどうかです。",
    why: "一問一答なら誤答は会話の中で直せます。裏で進む作業は、途中成果を見ないまま対外操作へ繋がると取り返しがつきません。だから確認は完了ボタンと同じ場所に置かない方が安全です。",
    deepWorkflow: [
      "事務・調整の深い例: ",
      "入力は依頼文、希望条件、接続してよいアプリ → ",
      "AIが候補の調査・下ごしらえ・下書きを裏で進める → ",
      "途中成果（候補一覧・下書き・予約案）を人が確認する → ",
      "支払い・送信・確定予約は人が承認してから進める。",
      "見る指標は、承認前に止めた件数と、承認後のやり直しです。",
    ].join(""),
    secondary: [
      "営業Opsは商談メモの整理とフォロー候補までを任せ、顧客送信は人が残します。",
      "サポートは過去対応の要点整理までを任せ、顧客説明の送信は人が押します。",
      "経理は明細の整理候補までを任せ、支払い承認は人が残します。",
    ].join(""),
    who: "向いているのは、同じ型の調査・予約・下書きが繰り返され、途中成果の確認者がいる個人や小チームです。まだ向いていないのは、支払い・送信・契約が同じ操作に繋がっている場合や、確認者が不在のまま常時接続する運用です。",
    review: "支払い、顧客送信、契約・予約の確定、権限変更は人が残します。候補収集と社内下書きは任せて構いません。",
    framework: [
      "この公開で見る判断は「今すぐ全自動か」ではなく「どこで止めるか」です。",
      "頻度: 同じ長作業が繰り返されるか。",
      "入力: 依頼条件と接続範囲を書けるか。",
      "検証: 途中成果を人が見られるか。",
      "可逆性: 支払い・送信の前に止められるか。",
      "責任: 最終承認者の名前が残るか。",
      "五つ揃うなら今試し、可逆性か責任が欠けるなら待ちます。",
    ].join(""),
    takeaway:
      "明日試すなら、繰り返しの調査か下書きを一つ選び、AIには途中成果まで作らせ、支払い・送信・確定の前に人の承認を挟んでください。一週間、承認前に止めた件数を数えます。",
  },
  {
    id: "documents",
    test: /document|context|pdf|contract/,
    focus: "ai-at-work",
    title: "長い資料は、見る項目を先に決めてから渡す",
    thesis: "長い資料を一度に渡せるようになっても、実務で効くのは全文要約より、人が見る箇所を先に絞ることです。",
    why: "全文を短くしただけでは、信じる数字と条件は決まりません。抜けた条件の方が高くつきます。",
    deepWorkflow: [
      "法務の深い例: ",
      "入力は契約PDFと確認したい三項目 → ",
      "AIが解約・損害賠償の該当箇所候補を示す → ",
      "担当者が原文へ戻って解釈・確認する → ",
      "承認や送付は人が行う。",
      "見る指標は、抜けた確認項目の有無です。",
    ].join(""),
    secondary: [
      "営業は提案書の約束事項を三項目に整理し、顧客説明前に人が文言を確定します。",
      "経理は請求条件ページだけを渡し、支払サイト解釈は人が残します。",
      "運用は手順書の該当ステップだけを抜き、本番可否は人が決めます。",
    ].join(""),
    who: "向いているのは同じ形式の長い資料が毎週来る部署です。まだ向いていないのは、毎回フォーマットが違い確認項目を三つ書けない場合です。",
    review: "契約承認、価格確定、法的解釈は人が残します。該当ページの候補出しは任せて構いません。",
    framework: [
      "頻度: 同じ形式の資料が繰り返されるか。",
      "入力: 確認したい項目を先に書けるか。",
      "検証: 原文に戻って見られるか。",
      "可逆性: 承認前に止められるか。",
      "責任: 承認者が明確か。",
      "項目を三つ書けないなら、要約より観点整理が先です。",
    ].join(""),
    takeaway: "明日試すなら、長い資料を一件選び、確認したい項目を三つ書いてからAIに該当箇所を探させ、判断は原文に戻って行ってください。抜けた項目が無かったかを一回で点検します。",
  },
  {
    id: "enterprise",
    test: /enterprise|governance|copilot|crm|operating/,
    focus: "enterprise",
    title: "企業のAIは、全社配布より既存手順の一段から始める",
    thesis: "企業でのAIは、試用デモから、誰がどの手順で使うかの運用へ移っています。",
    why: "発表の規模より、毎週同じ入力と出力がある一段を切れるかが現場の変化です。試験で一度うまくいっても、毎週の確認が残らなければ手順になりません。",
    deepWorkflow: [
      "営業マネージャーの深い例: ",
      "入力は商談メモと次回アクション欄 → ",
      "AIが次アクション候補を作る → ",
      "担当者が顧客への連絡文だけを確認・確定する → ",
      "送信は人が行う。",
      "見る指標は、承認条件を満たさない候補の割合です。",
    ].join(""),
    secondary: [
      "経理は科目候補を出し、承認者は金額と勘定科目だけを見ます。",
      "サポート運用は問い合わせ種別の分類を任せ、例外起票は人が行います。",
      "開発リードはレビュー観点リスト案を作り、マージ判断は人が残します。",
    ].join(""),
    who: "向いているのは手順書がある中規模チームです。まだ向いていないのは、手順が属人的で入力欄と承認者を書けない組織です。",
    review: "顧客連絡、支払い承認、権限変更は人が残します。社内候補リスト作成は任せて構いません。",
    framework: [
      "頻度: 毎週同じ作業か。",
      "入力: 欄が定義されているか。",
      "検証: 承認者が途中で見られるか。",
      "可逆性: 外に出す前に止められるか。",
      "責任: 承認者が一人に決まるか。",
      "五つ書けない導入計画は、全社展開より先に一段の定義へ戻します。",
    ].join(""),
    takeaway: "明日試すなら、チームで毎週発生している作業を一つ書き出し、AIが作るものとマネージャーが承認するものを分け、一週間その分担を守ってください。",
  },
  {
    id: "us-tech",
    test: /funding|startup|silicon|san francisco|regulat|antitrust/,
    focus: "us-tech",
    title: "米国テックの動きは、自社サービスの制約確認に落とす",
    thesis: "米国の技術や規制ニュースは、製品名暗記より、自社の仕事の制約が変わるかを見る材料です。",
    why: "資金・規制・大手方針はすぐ画面を変えるとは限りません。見るべきは、外部サービスの契約条件と顧客へ説明できる範囲です。",
    deepWorkflow: [
      "事業担当の深い例: ",
      "入力は今回の公開要点と利用中サービス一覧 → ",
      "AIが影響しそうな項目候補を洗う → ",
      "担当者が契約・データ条件を確認する → ",
      "手順変更の有無は人が決める。",
      "見る指標は、今週変えた手順が本当に必要だったかです。",
    ].join(""),
    secondary: [
      "法務はデータ条項の改定要否だけを見ます。",
      "開発・運用は接続先条件が変わったときだけ手順を更新します。",
      "営業は説明範囲が変わるときだけ文面を直し、変わらなければ提案を据え置きます。",
    ].join(""),
    who: "向いているのは外部サービス依存が大きいチームです。まだ向いていないのは、自社完結業務だけでサービス一覧が無い場合です。",
    review: "契約変更承認、顧客説明確定、サービス停止判断は人が残します。影響候補の洗い出しは任せて構いません。",
    framework: [
      "頻度: 自社サービスに関係しうる動きか。",
      "入力: 利用サービス一覧があるか。",
      "検証: 契約条件を人が確認できるか。",
      "可逆性: 手順を今週変えなくても困らないか。",
      "責任: 変更判断者が明確か。",
      "一覧が無いなら、ニュース購読より棚卸しが先です。",
    ].join(""),
    takeaway: "明日試すなら、今使っている外部サービスを三つ書き、今回の動きが契約条件かデータの扱いに触れるかだけを確認し、触れなければ今週の手順は変えないでください。",
  },
];

const DEFAULT_TOPIC: Topic = {
  id: "work-shift",
  focus: "ai-news",
  title: "新しい発表は、繰り返す確認作業の前段に落とす",
  thesis: "新しい発表の価値は、機能一覧ではなく、毎週繰り返している確認・下書き・調査を前段に出せるかで決まります。",
  why: "モデルやツール更新だけでは手順は変わりません。結果を見ない仕事は、速くなった分だけ誤りの確認が遅れます。前段に出せるのは、入力が揃い、採用前に止められる一段だけです。",
  deepWorkflow: [
    "企画・運用の深い例: ",
    "入力は今週すでに二度以上やった作業の素材 → ",
    "AIが初稿または整理案を作る → ",
    "担当者が事実と約束表現を確認する → ",
    "採用・送信・反映は人が行う。",
    "見る指標は、修正時間と差し戻し理由です。",
  ].join(""),
  secondary: [
    "開発は調査メモの一次稿までを任せ、採用変更はレビュー担当が選びます。",
    "サポートはFAQ候補を作り、公開回答はマネージャーが承認します。",
    "経理は社内説明の下書きだけを作り、数字の確定は人が残します。",
  ].join(""),
  who: "向いているのは繰り返し作業があり、採用者が一人に決まるチームです。まだ向いていないのは、毎回条件が違う例外作業で確認者が決まっていない場合です。",
  review: "顧客向け送信、価格決定、本番反映は人が残します。社内初稿は任せて構いません。",
  framework: [
    "頻度: 今週すでに二度以上あるか。",
    "入力: 同じ形で渡せるか。",
    "検証: 人が採用前に見られるか。",
    "可逆性: 外に出す前に止められるか。",
    "責任: 採用者が一人に決まるか。",
    "五つ揃うなら今試し、確認者が決まっていない機能追加は待ちます。",
  ].join(""),
  takeaway:
    "明日試すなら、今週すでに二度以上やった作業を一つ選び、AIには初稿だけを作らせ、採用する担当者を一人決め、一週間の修正時間を比べてください。",
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
    return `公開文面で確認できる変化は、${bits.join("、")}に関する案内です。数値・価格・ベンチマークの細部は出典の原文を優先します。`;
  }
  return "公開ページに書かれた範囲の事実だけを前提にします。";
}

/** Source-supported lead: publisher, timing, and publicly stated subject only. */
export function sourceFactLead(source: SourceRecord, support: readonly SourceRecord[] = []): string {
  const published = dateLabel(source.publishedAt);
  const when = published ? `${published}付で` : "";
  const subject = clip(source.title, 110);
  const primary = `${source.publisher}が${when}公開した案内の主題は「${subject}」です。${factFromSummary(source)}`;
  if (support.length === 0) {
    return [primary, "ここから先は、その事実を仕事の手順に落とす話です。"].join("");
  }
  const related = support
    .slice(0, 3)
    .map((item) => `${item.publisher}の「${clip(item.title, 60)}」`)
    .join("、");
  const synthesis =
    `関連公開として${related}も確認しました。あわせて読むと、個別機能名より「一問一答から、途中確認つきの実行へ移る」点が重なります。`;
  return [primary, synthesis, "ここから先は、その共通点を仕事の手順に落とす話です。"].join("");
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
  const facts = sourceFactLead(source, supportList);
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
    "## 仕事で変わること",
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
  const idx = body.search(/##\s*仕事で変わること/);
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
  return arrows >= 2 && /(入力|渡)/.test(body) && /(確認|レビュー|承認)/.test(body) && /(送信|採用|人が|残)/.test(body);
}

export function hasConcreteWorkflow(body: string): boolean {
  return hasDeepWorkflow(body);
}

export function hasSourceSpecificFacts(body: string, source: Pick<SourceRecord, "publisher" | "title" | "publishedAt">): boolean {
  if (!body.includes(source.publisher)) return false;
  if (!/公開/.test(body)) return false;
  const published = dateLabel(source.publishedAt);
  if (published && body.includes(published)) return true;
  const titleToken = cleanText(source.title).split(/[^a-zA-Z0-9\u3040-\u30ff\u4e00-\u9faf]+/).find((token) => token.length >= 4);
  if (titleToken && body.includes(titleToken.slice(0, Math.min(titleToken.length, 24)))) return true;
  return /主題は「/.test(body);
}

export function hasDecisionFramework(body: string): boolean {
  const axes = [/頻度/, /入力/, /検証/, /可逆/, /責任/].filter((pattern) => pattern.test(body)).length;
  return body.includes("Atlasの見方") && axes >= 3 && /(今|待つ|向いて|試し)/.test(body);
}

export function hasGenericTakeaway(body: string): boolean {
  const match = body.match(/##\s*明日試すなら\s*\n+([\s\S]*?)(?=\n##\s|$)/);
  const takeaway = match?.[1]?.trim() ?? "";
  if (!takeaway) return true;
  if (takeaway.length < 40) return true;
  if (GENERIC_TAKEAWAY.test(takeaway)) return true;
  if (!/(選|書|作|確認|比|残|決|保存|開|移|出|戻|止|分|直|見)/.test(takeaway)) return true;
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
  if (!blog.body.includes("Atlasの見方") || blog.body.trim().length < 400) reasons.push("missing editorial thesis");
  if (!/仕事|営業|サポート|担当|管理|経理|顧客|手順/.test(blog.body)) reasons.push("missing work relevance");
  if (!/明日試すなら/.test(blog.body)) reasons.push("missing practical takeaway");
  if (!blog.sourceUrls.some((url) => url.startsWith("https://"))) reasons.push("missing source url");
  if (/私は試した|私が使った|自分で検証した/.test(blog.body)) reasons.push("fabricated personal experience");
  if (hasMetaEditorialLanguage(blog.body)) reasons.push("meta editorial language");
  if (GENERIC_PHRASES.some((pattern) => pattern.test(blog.body))) reasons.push("generic phrasing");
  if (!hasSourceSpecificFacts(blog.body, source) && !source.evergreen) reasons.push("missing source-specific facts");
  if (concreteRoleCount(blog.body) < 2) reasons.push("missing concrete work examples");
  if (!hasDeepWorkflow(blog.body)) reasons.push("missing deep workflow");
  if (hasShallowGenericExamplesOnly(blog.body)) reasons.push("shallow generic examples");
  if (!hasDecisionFramework(blog.body)) reasons.push("missing decision framework");
  if (hasGenericTakeaway(blog.body)) reasons.push("generic practical takeaway");
  if (!source.evergreen && researchQuestionFor(source).trim().length < 12) reasons.push("missing research question");
  if (!hasResearchSynthesis(blog.body)) reasons.push("sources not synthesized");
  // More URLs alone do not prove research depth.
  if (blog.sourceUrls.length >= 3 && !hasResearchSynthesis(blog.body)) reasons.push("source count without research depth");
  if (research.length > 0) {
    const weak = weakSupportingUrls(source, blog.sourceUrls, research);
    if (weak.length > 0) reasons.push("weak supporting source");
  }
  return reasons;
}

export function supportingSources(primary: SourceRecord, research: readonly SourceRecord[]): SourceRecord[] {
  return supportingSourcesRelevant(primary, research, 3);
}

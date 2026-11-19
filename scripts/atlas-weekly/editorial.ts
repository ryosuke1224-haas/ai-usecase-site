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
  /生成した|生成プロセス|編集方針|内部QA|QAで/,
  /要約ではない|まとめ直しただけではない|翻訳しただけ/,
  /どのように書いたか|どう変換したか|どう構成したか/,
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

const WORKFLOW_MARKERS = /入力|渡す|→|確認|レビュー|送信|承認|採用|人が/;

const GENERIC_TAKEAWAY = /生産性を上げる|うまく活用|積極的に使う|AIを導入する|効率化を進める/;

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
  change: string;
  examples: string;
  workflow: string;
  who: string;
  review: string;
  view: string;
  takeaway: string;
};

const TOPIC: Topic[] = [
  {
    id: "customer-review",
    test: /support|customer|reply|inbox/,
    focus: "ai-at-work",
    title: "顧客への返信は、どこまでAIに任せてどこから人が見るのか",
    thesis: "顧客対応で変わっているのは、文面を速く作れることより、送る前の確認を誰が持つかです。",
    change: "問い合わせの一次案をソフトウェアが用意し、担当者が内容・相手・約束できる範囲を見てから送る、という分け方が実務の単位になりつつあります。変わったのはモデル名ではなく、返信の責任が「書く人」から「送る前に止める人」へ移ることです。速く返すことと、間違った約束をしないことは別の仕事です。",
    examples: [
      "サポートでは、返信件名、依頼内容、返金可否の三欄を埋めた下書きをAIが作り、担当者は約束表現だけを直して送信します。",
      "営業では、見積の前提条件を抜き出した短い確認文を作り、金額や納期の断定は人が書き足します。",
      "経理連携の問い合わせでは、入金状況の事実欄だけを埋め、値引きや例外対応の文言は人が決めます。",
      "マネージャーは、同じ週に確認なしで送られた件数を見て、手順が省かれていないかを点検します。",
    ].join(""),
    workflow: "入力は受信メールと社内ルールです。AIは返信案を作り、担当者が宛先・期日・禁止表現を確認し、最後に人が送信ボタンを押します。確認欄が空のまま送れない形にします。",
    who: "繰り返し問い合わせが多いチームでは今すぐ使えます。例外対応が大半の少人数窓口では、下書きより先に分類ルールの整理が必要です。",
    review: "顧客への送信、返金、例外対応、個人情報の開示は人が残します。社内ラベル付けだけならレビューを軽くできます。",
    view: "今日成熟しているのは下書きまでです。全自動返信は、確認役がいないままではまだ早いです。確認欄が三つ以上書けないチームは、導入より手順の定義が先です。",
    takeaway: "明日試すなら、繰り返し届く問い合わせを一件選び、AIには返信案だけを作らせ、宛先・期日・禁止表現の三欄を担当者が確認してから送信してください。一週間、確認なし送信がゼロかを数えます。",
  },
  {
    id: "invoice-review",
    test: /invoice|payment|overdue|collection/,
    focus: "ai-at-work",
    title: "未入金の確認は、一覧づくりと最終判断を分けられる",
    thesis: "請求のフォローで変わっているのは、催促文の上手さより、遅れている案件を人が見逃さない仕組みです。",
    change: "入金遅れの一覧づくりと、先方へ送る文面の下書きが分かれてきています。決済機能の発表そのものより、今日見る三件を人が選べる状態になったことが実務の変化です。滞留は文章の上手さより、抜け漏れで遅れます。",
    examples: [
      "経理は、遅延日数と金額で並んだ候補から三件を選び、催促文の事実関係だけを確認します。",
      "営業事務は、取引先ごとの未入金メモを短く整理し、担当営業が電話する順番を決めます。",
      "分析担当は、滞留日数の偏りだけをまとめ、値引き判断には入りません。",
      "マネージャーは、自動送信せずに止めた理由を週次で見て、関係を壊しやすい相手を除外します。",
    ].join(""),
    workflow: "入力は未入金一覧です。AIは優先候補と文面下書きを出し、担当者が金額と相手関係を確認し、人が送るか保留かを選びます。",
    who: "件数が多い経理・営業事務では効きます。件数が少なく相手ごとに事情が違う場合は、一覧化より担当者の記憶の方が早いこともあります。",
    review: "督促の送信、入金消込、値引き交渉は人が残します。候補の並べ替えだけなら自動化して構いません。",
    view: "優先順位の下ごしらえは実用段階です。自動督促の送り切りは、相手関係を壊しやすいのでまだ過大です。金額と相手名を確認する欄が無い運用は止めます。",
    takeaway: "明日試すなら、未入金の一覧から三件だけ選び、AIに文面下書きを作らせ、送るか保留かは担当者が別操作で決めてください。一週間、誤送信と保留理由をメモします。",
  },
  {
    id: "long-work",
    test: /agent|long-running|workflow|hours/,
    focus: "ai-news",
    title: "AIは「質問に答える」から「長時間の仕事を任せる」段階へ",
    thesis: "AIの単位が、一問一答から、途中経過の残る長めの作業へ移っています。",
    change: "人が一度依頼し、ソフトウェアが調査や下書きを進め、人が区切りで見直す形が増えています。短答の速さより、数時間分の下ごしらえを途中停止できるかが実務の変化です。長い作業ほど、途中の誤りが最後まで残ります。",
    examples: [
      "営業事務は、顧客メモの一次整理を任せ、担当者が要点と次の行動だけを確認します。",
      "開発は、調査メモや差分候補の作成までを任せ、本番に入れる変更は人が選びます。",
      "分析担当は、データの抜け確認リストを作り、報告に使う数字は人が確定します。",
      "サポートは、過去対応の要点整理までを任せ、顧客への説明文は人が仕上げます。",
    ].join(""),
    workflow: "入力は依頼文と参照資料です。AIは途中成果を出し、担当者が誤りを直し、最終判断や送信・反映は人が行います。",
    who: "毎週同じ調査や整理があるチーム向きです。一回きりの例外作業では、途中確認の設計コストの方が大きくなりがちです。",
    review: "対外送信、本番変更、契約条件の確定、金額確定は人が残します。途中メモの整理は任せて構いません。",
    view: "下準備の長時間作業は使い始められます。確認役なしの全自動完了はまだ過大です。途中成果を見る人が決まっていないなら、導入は早いです。",
    takeaway: "明日試すなら、毎週繰り返す確認作業を一つ選び、AIには途中成果だけを作らせ、完了判断は担当者の名前を残してください。一週間、途中成果の修正回数を数えます。",
  },
  {
    id: "documents",
    test: /document|context|pdf|contract|policy/,
    focus: "ai-at-work",
    title: "長い資料をAIに任せる仕事はどこまで現実的になったのか",
    thesis: "長い資料を一度に渡せるようになっても、実務で使えるのは全文要約より、人が見る箇所を先に絞れることです。",
    change: "契約・規程・提案資料を最初から最後まで人が追う前提が弱くなっています。変化は、期限・金額・解約条件のような確認点を先に出せるようになったことです。全文を短くしただけでは、信じる数字と条件は決まりません。",
    examples: [
      "法務は、解約条項と損害賠償の該当箇所だけを抜き出し、原文へ戻って判断します。",
      "営業は、提案書の約束事項を三項目に整理し、顧客説明の前に人が文言を確定します。",
      "経理は、請求条件のページだけを渡し、支払サイトの解釈は人が残します。",
      "運用担当は、手順書の該当ステップだけを抜き、本番作業の可否は人が決めます。",
    ].join(""),
    workflow: "入力は資料と確認したい三項目です。AIは該当箇所を示し、担当者が原文を読み、承認や送付は人が行います。",
    who: "同じ形式の長い資料が毎週来る部署では効きます。毎回フォーマットが違う資料では、先に見る項目の定義が必要です。",
    review: "契約承認、価格確定、法的解釈は人が残します。該当ページの候補出しは任せて構いません。",
    view: "確認項目の抽出は実用段階です。資料を読まずに承認するのはまだ危険です。確認したい項目を三つ書けないなら、要約より先に観点の整理が必要です。",
    takeaway: "明日試すなら、長い資料を一件選び、確認したい項目を三つ書いてからAIに該当箇所を探させ、判断は原文に戻って行ってください。抜けた項目が無かったかを一回で点検します。",
  },
  {
    id: "enterprise",
    test: /enterprise|governance|copilot|crm|operating/,
    focus: "enterprise",
    title: "企業のAI活用は、試験から日常の手順へ移り始めている",
    thesis: "企業でのAIは、試用のデモから、誰がどの手順で使うかの運用へ話題が移っています。",
    change: "全社ツール配布より、営業・経理・顧客対応の既存手順のどこに下書きを挟むかが論点になっています。発表の規模より、毎週同じ入力と出力がある一段を切れるかが現場の変化です。試験で一度うまくいっても、毎週の確認が残らなければ手順にはなりません。",
    examples: [
      "営業マネージャーは、商談メモから次アクション案を作り、担当者が顧客への連絡文だけを確定します。",
      "経理は、明細の科目候補を出し、承認者は金額と勘定科目だけを見ます。",
      "サポート運用は、問い合わせ種別の分類を任せ、例外対応の起票は人が行います。",
      "開発リードは、レビュー観点のチェックリスト案を作り、マージ判断は人が残します。",
    ].join(""),
    workflow: "入力は既存の繰り返し作業です。AIは下書きや候補を出し、マネージャーが承認条件を確認し、外に出す操作は人が実行します。",
    who: "すでに手順書がある中規模チーム向きです。手順が属人的な少人数組織では、先に作業の型を書く必要があります。",
    review: "顧客連絡、支払い承認、権限変更は人が残します。社内候補リストの作成は任せて構いません。",
    view: "既存手順の一段置き換えは今やる価値があります。全社一括の働き方刷新はまだ過大です。入力欄と承認者が書けない導入計画は止めます。",
    takeaway: "明日試すなら、チームで毎週発生している作業を一つ書き出し、AIが作るものとマネージャーが承認するものを分け、一週間その分担を守ってください。",
  },
  {
    id: "us-tech",
    test: /funding|startup|silicon|san francisco|regulat|policy|antitrust/,
    focus: "us-tech",
    title: "米国テックの動きを、自社の来月の判断に落とす",
    thesis: "米国の技術や規制のニュースは、製品名を覚えることより、自社の仕事の制約が変わるかを見るための材料です。",
    change: "資金・規制・大手方針は、すぐ国内中小企業の画面を変えるとは限りません。実務で見るべき変化は、使っている外部サービスの契約条件と、顧客へ説明できる範囲です。遠い発表を追うこと自体に、明日の売上は結びつきません。",
    examples: [
      "事業担当は、利用中の外部サービス三件が対象に含まれるかだけを確認します。",
      "法務・総務は、データ扱いの条項が触られるかを見て、説明文の改訂要否を決めます。",
      "開発・運用は、接続先の利用条件が変わったときだけ手順を更新します。",
      "営業は、顧客への説明範囲が変わるときだけ文面を直し、変わらなければ今週の提案は据え置きます。",
    ].join(""),
    workflow: "入力は今回のニュース要点と利用サービスの一覧です。AIは影響しそうな項目を洗い出し、担当者が契約・データ条件を確認し、手順変更の有無は人が決めます。",
    who: "外部サービス依存が大きいチームでは今確認する価値があります。自社完結の業務だけなら、週次で追う優先度は低くてよいです。",
    review: "契約変更の承認、顧客説明の確定、サービス停止判断は人が残します。影響候補の洗い出しは任せて構いません。",
    view: "影響の有無の切り分けは有用です。米国の大きな話をそのまま自社戦略転換にするのはまだ早いことが多いです。自社サービス一覧が無いなら、ニュース購読より先に棚卸しです。",
    takeaway: "明日試すなら、今使っている外部サービスを三つ書き、今回の動きが契約条件かデータの扱いに触れるかだけを確認し、触れなければ今週の手順は変えないでください。",
  },
];

const DEFAULT_TOPIC: Topic = {
  id: "work-shift",
  focus: "ai-news",
  title: "新しい発表を、既存の仕事の確認手順に落とす",
  thesis: "新しい発表の価値は、機能一覧ではなく、毎週繰り返している確認・下書き・調査のどこを前段に出せるかで決まります。",
  change: "モデルや開発ツールの更新だけでは仕事の手順は変わりません。実務の変化は、担当者が毎週同じ形でやっている作業を、下書きまで任せて確認を残せるようになったことです。機能が増えても、結果を見ない仕事は誤りの確認が遅れます。",
  examples: [
    "企画は、週次の説明文の初稿だけを作り、採用する表現は担当者が決めます。",
    "運用は、障害メモの整理案を作り、対外案内の文言は人が確定します。",
    "開発は、調査メモの一次稿を作り、採用する変更はレビュー担当が選びます。",
    "サポートは、FAQ候補を作り、公開する回答はマネージャーが承認します。",
  ].join(""),
  workflow: "入力は今週すでに二度以上やった作業です。AIは初稿を出し、担当者が事実と約束表現を確認し、採用・送信・反映は人が行います。",
  who: "繰り返し作業があるチームでは今すぐ試せます。毎回条件が違う例外作業では、型を決めてからが先です。",
  review: "顧客向け送信、価格決定、本番反映は人が残します。社内初稿は任せて構いません。",
  view: "一つの繰り返し作業への適用は実用的です。発表のたびに道具を替えるのは手間が増えがちです。確認者が決まっていない機能追加は、まだ早いです。",
  takeaway: "明日試すなら、今週すでに二度以上やった作業を一つ選び、AIには初稿だけを作らせ、採用する担当者を一人決め、一週間の修正時間を比べてください。",
};

function topicFor(source: SourceRecord): Topic {
  const text = `${source.title} ${source.summary}`.toLowerCase();
  return TOPIC.find((item) => item.test?.test(text)) ?? DEFAULT_TOPIC;
}

function dateLabel(value: string | null): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return value.slice(0, 10);
}

export function editorialArticle(source: SourceRecord, support: readonly SourceRecord[] = []): {
  title: string;
  summary: string;
  body: string;
  focus: EditorialFocus;
  category: WeeklyCategory;
  sourceUrls: string[];
} {
  const topic = topicFor(source);
  const profile = describeSource(source);
  const focus = topic.focus ?? profile.focus;
  const published = dateLabel(source.publishedAt);
  const secondary = support.find((item) => item.canonicalUrl !== source.canonicalUrl && !describeSource(item).lowValue);
  const evidence = [
    `${source.publisher}が${published ? `${published}に` : ""}公開した情報を、この変化の裏付けとして見ています。`,
    secondary
      ? `${secondary.publisher}の公開情報も、同じ方向の変化があるかを確認するために参照しています。`
      : "公開情報は事実確認の材料であり、現場の手順に落とせるかが記事の基準です。",
  ].filter(Boolean).join("");
  const body = [
    topic.thesis,
    "",
    topic.change,
    "",
    evidence,
    "",
    "## 仕事で変わること",
    "",
    topic.examples,
    "",
    `具体的な流れは次です。${topic.workflow}`,
    "",
    topic.who,
    "",
    `人が残す確認は明確です。${topic.review}`,
    "",
    "## Atlasの見方",
    "",
    topic.view,
    "",
    "判断の軸は、今すぐ使えるか、条件が揃うまで待つか、別の問題を先に直すか、の三つです。",
    "",
    "## 明日試すなら",
    "",
    topic.takeaway,
    "",
    "## 出典",
    "",
    `[${source.publisher}](${source.canonicalUrl})`,
    secondary ? `[${secondary.publisher}](${secondary.canonicalUrl})` : "",
  ].filter((line) => line !== "").join("\n");
  const sourceUrls = [source.canonicalUrl, ...(secondary ? [secondary.canonicalUrl] : [])];
  return {
    title: topic.title,
    summary: topic.thesis,
    body,
    focus,
    category: storedCategory(focus),
    sourceUrls,
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
  const summary = source.summary.replace(/\s+/g, " ").trim();
  if (summary.length >= 40 && body.includes(summary.slice(0, 80))) return true;
  const distinctive = `${source.title} ${summary}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 5);
  if (distinctive.length < 4) return false;
  const bodyTokens = new Set(body.toLowerCase().split(/[^a-z0-9]+/));
  const shared = distinctive.filter((token) => bodyTokens.has(token)).length;
  return shared / distinctive.length >= 0.45;
}

export function hasMetaEditorialLanguage(body: string): boolean {
  return META_LANGUAGE.some((pattern) => pattern.test(body));
}

export function concreteRoleCount(body: string): number {
  return ROLE_MARKERS.filter((role) => body.includes(role)).length;
}

export function hasConcreteWorkflow(body: string): boolean {
  return WORKFLOW_MARKERS.test(body) && /(確認|レビュー|承認|送信|採用)/.test(body);
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

export function editorialFailures(blog: Pick<BlogDraft, "title" | "body" | "sourceUrls">, source: SourceRecord): string[] {
  const reasons: string[] = [];
  if (titleRepeatsSource(blog.title, source.title)) reasons.push("translated source title");
  if (paraphrasesSource(blog.body, source)) reasons.push("source paraphrase");
  if (!blog.body.includes("Atlasの見方") || blog.body.trim().length < 400) reasons.push("missing editorial thesis");
  if (!/仕事|営業|サポート|担当|管理|経理|顧客|手順/.test(blog.body)) reasons.push("missing work relevance");
  if (!/明日試すなら/.test(blog.body)) reasons.push("missing practical takeaway");
  if (!blog.sourceUrls.some((url) => url.startsWith("https://"))) reasons.push("missing source url");
  if (/私は試した|私が使った|自分で検証した/.test(blog.body)) reasons.push("fabricated personal experience");
  if (hasMetaEditorialLanguage(blog.body)) reasons.push("meta editorial language");
  if (concreteRoleCount(blog.body) < 2) reasons.push("missing concrete work examples");
  if (!hasConcreteWorkflow(blog.body)) reasons.push("missing concrete workflow");
  if (hasGenericTakeaway(blog.body)) reasons.push("generic practical takeaway");
  return reasons;
}

export function supportingSources(primary: SourceRecord, research: readonly SourceRecord[]): SourceRecord[] {
  const focus = describeSource(primary).focus;
  return research
    .filter((item) => !item.evergreen)
    .filter((item) => item.canonicalUrl !== primary.canonicalUrl)
    .filter((item) => item.publisher.toLowerCase() !== primary.publisher.toLowerCase())
    .filter((item) => !describeSource(item).lowValue)
    .filter((item) => describeSource(item).focus === focus)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 1);
}

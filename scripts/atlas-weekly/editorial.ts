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

const TOPIC = [
  {
    id: "customer-review",
    test: /support|customer|reply|inbox/,
    focus: "ai-at-work" as const,
    title: "顧客への返信は、どこまでAIに任せてどこから人が見るのか",
    thesis: "顧客対応で変わっているのは、文面を速く作れることより、送る前の確認を誰が持つかです。",
    change: "問い合わせの一次案をソフトウェアが用意し、担当者が内容と相手を見てから送る、という分け方が実務の単位になりつつあります。新しいモデル名そのものより、返信の責任がどこに残るかが変化です。",
    why: "速く返せることと、間違った約束をしないことは別です。一次案が短時間で出るようになるほど、確認しないまま送るリスクは大きくなります。",
    work: "サポート担当は、毎回ゼロから文面を書く代わりに、返信件名、依頼内容、こちらが約束できる範囲の三つを確認する仕事に寄せられます。マネージャーは、その確認が省かれていないかを見ます。",
    view: "今日実用的なのは下書きまでです。顧客への送信、返金、例外対応まで自動で終える段階ではありません。宣伝文句にある全自動対応は、まだ仕事の手順より先にあります。",
    takeaway: "明日試すなら、繰り返し届く問い合わせを一件選び、AIには返信案だけを作らせ、送信ボタンは担当者が押すルールにしてください。",
  },
  {
    id: "invoice-review",
    test: /invoice|payment|overdue|collection/,
    focus: "ai-at-work" as const,
    title: "未入金の確認は、一覧づくりと最終判断を分けられる",
    thesis: "請求のフォローで変わっているのは、催促文の上手さより、遅れている案件を人が見逃さない仕組みです。",
    change: "入金遅れの一覧と、先方に確認する文面の下書きを分ける動きです。新しい決済機能の発表が、そのまま回収担当の仕事を置き換えるわけではありません。",
    why: "滞留している請求は、文章の品質より、どの案件を今日見るかの抜け漏れで遅れます。",
    work: "経理または営業事務は、遅延日数と金額の大きいものから目を通し、送る文面の事実関係だけを確認できます。入金処理そのものは人が残します。",
    view: "実用的なのは優先順位の下ごしらえです。自動で督促を送り切ることは、相手との関係を壊しやすいので、まだ人の判断が必要です。",
    takeaway: "明日試すなら、未入金の一覧から三件だけ選び、文面の下書きと、実際に送るかの判断を別の作業にしてください。",
  },
  {
    id: "long-work",
    test: /agent|long-running|workflow|hours/,
    focus: "ai-news" as const,
    title: "AIは「質問に答える」から「長時間の仕事を任せる」段階へ",
    thesis: "AIの単位が、一問一答から、途中経過の残る長めの作業へ移っています。",
    change: "人が一度依頼し、ソフトウェアが調査や下書きを進め、人が区切りで見直す形です。個別の製品が公開されたことより、任せられる作業の長さが変わっています。",
    why: "短い質問への回答と、数時間分の下ごしらえでは、確認の置き場所が違います。長い作業ほど、途中の誤りが最後まで残ります。",
    work: "営業事務なら、顧客メモの一次整理を任せ、担当者が要点と次の行動だけを確認できます。開発であれば、調査メモの作成までを任せ、採用する変更は人が決めます。",
    view: "今日できるのは下準備です。最終判断、対外的な送信、本番の変更まで任せる話ではありません。長い作業時間をうたう説明は、確認役がいないままではまだ先行しています。",
    takeaway: "明日試すなら、毎週繰り返す確認作業を一つ選び、AIには途中成果だけを作らせ、完了の判断は担当者の名前を残してください。",
  },
  {
    id: "documents",
    test: /document|context|pdf|contract|policy/,
    focus: "ai-at-work" as const,
    title: "長い資料をAIに任せる仕事はどこまで現実的になったのか",
    thesis: "長い資料を一度に渡せるようになっても、実務で使えるのは要約そのものより、人が見る箇所を先に絞れることです。",
    change: "契約、規程、提案資料のような長い文書を、最初から最後まで人の目だけで追う前提が弱くなっています。変化は、資料の中の確認点を先に出せるようになったことです。",
    why: "全文を短くしただけでは、どの数字とどの条件を信じるかは決まりません。抜けた条件の方が、仕事では高くつきます。",
    work: "法務や営業の担当者は、全文の代わりに、期限、金額、解約条件のような確認項目を先にリストアップさせ、原文の該当箇所だけを読めます。",
    view: "実用的なのは確認項目の抽出です。資料全体を読まずに承認することは、まだ危険です。長い文脈に対応したという説明だけでは、抜け漏れの責任は消えません。",
    takeaway: "明日試すなら、長い資料を一件選び、確認したい項目を三つ書いてからAIに該当箇所を探させ、判断は原文に戻って行ってください。",
  },
  {
    id: "enterprise",
    test: /enterprise|governance|copilot|crm|operating/,
    focus: "enterprise" as const,
    title: "企業のAI活用は、試験から日常の手順へ移り始めている",
    thesis: "企業でのAIは、試用のデモから、誰がどの手順で使うかの運用へ話題が移っています。",
    change: "ツールを足す話ではなく、既存の営業、経理、顧客対応の手順のどこにAIを挟むかが変化です。全社導入の発表と、現場の一日の作業はまだ一致しません。",
    why: "試験で一度うまくいっても、担当者が毎週同じ確認をしないなら、その作業は手順になっていません。",
    work: "部門のマネージャーは、新しい製品を全員に配る前に、一つの繰り返し作業を選び、入力、下書き、人の承認の三段に分けられます。",
    view: "実用的なのは、既存手順の一段を置き換えることです。会社全体の働き方を一度に入れ替える話は、まだ導入の摩擦より先に宣伝されています。",
    takeaway: "明日試すなら、チームで毎週発生している作業を一つ書き出し、AIが作るものと、マネージャーが承認するものを分けてください。",
  },
  {
    id: "us-tech",
    test: /funding|startup|silicon|san francisco|regulat|policy|antitrust/,
    focus: "us-tech" as const,
    title: "米国テックの動きを、自社の来月の判断に落とす",
    thesis: "米国の技術や規制のニュースは、製品名を覚えることより、自社の仕事の制約が変わるかを見るための材料です。",
    change: "資金、規制、大手の方針は、すぐに国内の中小企業の画面を変えるわけではありません。変わる可能性があるのは、使っている外部サービスの条件と、顧客へ説明できる範囲です。",
    why: "遠い企業の発表を追うこと自体には、明日の売上は結びつきません。制約や費用の前提が変わるときだけ、仕事の判断になります。",
    work: "事業の担当者は、今使っている外部サービスが対象に含まれるかだけを確認し、含まれなければ今週の手順は変えません。含まれるなら、顧客への説明文を人が見直します。",
    view: "実用的なのは影響の有無の切り分けです。米国の大きな話を、そのまま自社の戦略転換として扱うのはまだ早いことが多いです。",
    takeaway: "明日試すなら、今の業務で使っている外部サービスを三つ書き、今回の動きが契約条件かデータの扱いに触れるかだけを確認してください。",
  },
] as const;

const DEFAULT_TOPIC = {
  id: "work-shift",
  focus: "ai-news" as const,
  title: "AIの新機能より、既存の仕事のどこを任せるかが問われている",
  thesis: "新しい発表の価値は、機能一覧ではなく、既存の仕事のどの一段を任せられるようになったかで決まります。",
  change: "モデルや開発ツールの更新は、それだけでは仕事の手順になりません。変化として見るべきなのは、人が毎週やっている確認、下書き、調査のどこを前段に出せるかです。",
  why: "機能が増えても、担当者が結果を見ない仕事は、速くなった分だけ誤りの確認が遅れます。",
  work: "企画や運用の担当者は、新しい機能を全員に配る代わりに、毎週同じ説明をしている作業を一つ選び、下書きまでを任せて確認を残せます。",
  view: "実用的なのは一つの繰り返し作業です。発表のたびに道具を替えることは、仕事の改善より手間になることが多いです。",
  takeaway: "明日試すなら、今週すでに二度以上やった作業を一つ選び、AIには初稿だけを作らせ、採用するかは担当者が決めてください。",
};

function topicFor(source: SourceRecord) {
  const text = `${source.title} ${source.summary}`.toLowerCase();
  return TOPIC.find((item) => item.test.test(text)) ?? DEFAULT_TOPIC;
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
    `${source.publisher}が公開した情報は、この変化を裏づける材料です。`,
    published ? `確認した公開日は${published}です。` : "",
    "発表の見出しや製品の宣伝文は、この記事の構成にしていません。",
  ].filter(Boolean).join("");
  const extra = secondary
    ? `同じ方向を示す別の出典として、${secondary.publisher}の公開情報も見ています。そちらも見出しの言い換えではなく、変化の有無を見るために使っています。`
    : "今回は権威のある出典が一つなので、その事実の範囲だけで論点を組んでいます。";
  const body = [
    topic.thesis,
    "",
    topic.change,
    "",
    evidence,
    extra,
    "",
    topic.why,
    "",
    "確認する人と、外に出す人を同じにしてしまうと、確認は形だけになります。役割を分けると、その作業は明日からも手順として残ります。Atlasの記事が足すのは発表の言い換えではなく、どの一段を任せてよいかの判断です。公開情報は証拠として残し、確認を省く自動化はこの記事では勧めていません。読者が得るのは、元の発表を短くしたものではなく、次にどの作業を分けるかという判断です。",
    "",
    "## 仕事で変わること",
    "",
    topic.work,
    "",
    "## Atlasの見方",
    "",
    topic.view,
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

export function editorialFailures(blog: Pick<BlogDraft, "title" | "body" | "sourceUrls">, source: SourceRecord): string[] {
  const reasons: string[] = [];
  if (titleRepeatsSource(blog.title, source.title)) reasons.push("translated source title");
  if (paraphrasesSource(blog.body, source)) reasons.push("source paraphrase");
  if (!blog.body.includes("Atlasの見方") || blog.body.trim().length < 400) reasons.push("missing editorial thesis");
  if (!/仕事|営業|サポート|担当|管理|経理|顧客|手順/.test(blog.body)) reasons.push("missing work relevance");
  if (!/明日試すなら/.test(blog.body)) reasons.push("missing practical takeaway");
  if (!blog.sourceUrls.some((url) => url.startsWith("https://"))) reasons.push("missing source url");
  if (/私は試した|私が使った|自分で検証した/.test(blog.body)) reasons.push("fabricated personal experience");
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

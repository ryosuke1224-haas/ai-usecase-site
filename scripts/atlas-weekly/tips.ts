import type { WeeklyCategory } from "./types";

export type TipTopic = {
  id: string;
  title: string;
  summary: string;
  body: string;
  sourceTitle: string;
  sourceSummary: string;
  sourceUrls: readonly string[];
  category: WeeklyCategory;
  workflow: string | null;
};

type TipParts = {
  id: string;
  title: string;
  summary: string;
  sourceTitle: string;
  sourceSummary: string;
  sourceUrls: readonly string[];
  workflow: string | null;
  thesis: string;
  change: string;
  why: string;
  detail: string;
  work: string;
  view: string;
  takeaway: string;
};

function tip(parts: TipParts): TipTopic {
  const links = parts.sourceUrls.map((url) => `[公式ドキュメント](${url})`).join("\n");
  const body = [
    parts.thesis,
    "",
    parts.change,
    "",
    parts.why,
    "",
    parts.detail,
    "",
    "## 仕事で変わること",
    "",
    parts.work,
    "",
    "## Atlasの見方",
    "",
    parts.view,
    "",
    "## 明日試すなら",
    "",
    parts.takeaway,
    "",
    "## 出典",
    "",
    links,
  ].join("\n");
  return {
    id: parts.id,
    title: parts.title,
    summary: parts.summary,
    body,
    sourceTitle: parts.sourceTitle,
    sourceSummary: parts.sourceSummary,
    sourceUrls: parts.sourceUrls,
    category: "practical-ai",
    workflow: parts.workflow,
  };
}

/** Stable, documentation-backed advice. Order is the weekly rotation. */
export const TIP_TOPICS: readonly TipTopic[] = [
  tip({
    id: "usage-cost",
    title: "AIの利用量を増やす前に、送る文章を削る",
    summary: "同じ作業でも、毎回すべての履歴を送ると呼び出しは重くなります。必要な範囲だけを送る手順です。",
    sourceTitle: "Prompt caching documentation",
    sourceSummary: "Provider documentation explains that a repeated prompt prefix can be reused instead of resending the same instructions on every call.",
    sourceUrls: ["https://platform.openai.com/docs/guides/prompt-caching"],
    workflow: null,
    thesis: "AIの費用を下げる最初の一手は、モデルを替えることより、毎回送っている文章を短くすることです。同じ説明、同じ社内ルール、同じ過去の往復を呼び出しのたびに足すと、作業の中身が変わっていなくても処理する量だけが増えます。",
    change: "分類、下書き、抜き出しでは、判断に使う欄だけを残します。顧客名、日付、依頼の一文、社内の禁止事項。それ以外の履歴は、その回の判断に効くときだけ足します。指示文そのものは毎週書き換えず、安定した前置きとして置きます。",
    why: "長い履歴は丁寧に見えますが、モデルは関係のない段落にも注意を使います。担当者が直す箇所は増えないのに、待ち時間と確認の手間だけが残ります。先に削る範囲を決めると、あとから小さいモデルへ移す判断もできます。",
    detail: "削る対象は、挨拶、前の往復の全文、判断に使わない社内の経緯です。残すのは、今回の依頼文、守る条件、出力してほしい欄です。この三つが揃っていれば、長い履歴を足さなくても担当者は抜けを見つけられます。",
    work: "サポートは直近の依頼だけ、経理は請求書の該当行だけ、営業は次の約束に関するメモだけを渡します。部署ごとの「送ってよい欄」を一枚にすると、担当が替わっても同じ量で依頼できます。",
    view: "Atlasでは、公開ドキュメントが説明している再利用の考え方を、費用の数字には置き換えません。下がるかどうかは自社の請求画面で見るもので、記事の中で割合を作ることはしません。記事が渡すのは、送る範囲を決める順番です。",
    takeaway: "明日、一番多い依頼を一つ選び、毎回付けている段落を三つ書き出してください。そのうち判断に使っていないものを外し、同じ依頼を短い入力でもう一度出します。差は出力の抜けと、担当者が直す時間で見ます。",
  }),
  tip({
    id: "model-size",
    title: "仕分けは小さいモデル、最終文は大きいモデル",
    summary: "すべての文章を大きいモデルに通す必要はありません。工程ごとにモデルを分ける基準です。",
    sourceTitle: "Model documentation",
    sourceSummary: "Provider model documentation distinguishes smaller and larger models so teams can match a model to the task instead of using one model for every step.",
    sourceUrls: ["https://platform.openai.com/docs/models"],
    workflow: null,
    thesis: "モデルの大小は性能の順位ではなく、工程の分担です。ラベル付け、振り分け、抜けの検出は小さいモデルで足りることが多く、顧客に出す最終文や例外の説明だけを大きいモデルに残すと、確認する場所がはっきりします。",
    change: "一つの依頼を二段に分けます。一段目は「どの種類か」「どの担当か」「不足している欄は何か」。二段目は、外に出す文章が必要なときだけです。一段目の結果が曖昧なら、大きいモデルへ進む前に人が見ます。",
    why: "全部を大きいモデルに通すと、簡単な仕分けでも待ち、出力の揺れも大きくなります。逆に、難しい例外まで小さいモデルに任せると、それらしい短文で重要な条件が落ちます。分ける基準は、外に出るかどうかです。",
    detail: "比べるときは、同じ十件を両方に通すのではありません。一段目の分類結果だけを人が見て、誤りの種類をメモします。宛先の取り違えは大きいモデルへ回し、表記の揺れは小さいモデルのままで十分です。",
    work: "営業の見込み分類、経理の科目候補、サポートの問い合わせ種別は一段目です。見積の最終文、支払い条件の説明、顧客への返答は二段目です。担当者は二段目だけを読み、一段目は候補リストとして扱います。",
    view: "Atlasは、どちらのモデルが常に上かを断定しません。公式のモデル一覧は選択肢の地図であり、自社の正解率は自社の例で測ります。記事が勧めるのは、同じ例を二段に分けて比べることです。",
    takeaway: "明日、繰り返している依頼を十件選び、種別の分類だけを小さいモデルに出してください。最終文は作りません。人が直した件数をメモし、その件数が多い種類だけを次の大きいモデルの対象にします。メモは公開せず、次の週の対象を決めるためだけに残します。",
  }),
  tip({
    id: "prompt-caching",
    title: "毎回同じ指示は、キャッシュできる形に固定する",
    summary: "指示文を毎回少しずつ変えると、再利用できる前置きが残りません。固定する範囲の決め方です。",
    sourceTitle: "Stable prefix reuse note",
    sourceSummary: "A provider guide explains that a repeated instruction prefix can be kept while the changing request stays after that prefix.",
    sourceUrls: ["https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"],
    workflow: null,
    thesis: "プロンプトキャッシュは、同じ前置きを毎回作り直さないための仕組みです。効かせるには、変わらない指示を先頭に固定し、その回だけの依頼を後ろに置きます。日付や顧客名を指示の途中に挟むと、再利用できる塊が割れます。",
    change: "前置きには、役割、禁止事項、出力の欄、社内の呼び方だけを置きます。顧客名、金額の有無を推測させる材料、今日の日付は後ろの依頼に移します。前置きは週次で見直し、案件ごとに書き換えません。",
    why: "指示を少しずつ足していく運用は、担当者には改善に見えます。システムから見ると、毎回別の文章です。固定した前置きがあれば、変更は後ろの依頼だけになり、何が結果を変えたかも追いやすくなります。",
    detail: "前置きに入れてよいのは、役割、禁止事項、出力欄、社内の呼び方です。案件番号や相手の名前を前置きへ戻したくなったら、それは後ろの依頼です。更新は週に一度、差分が見える形で残します。",
    work: "サポートの返答方針、経理の確認項目、営業の次の行動の型は前置きにできます。個別の案件メモは前置きに入れません。手順書の担当は前置きの更新日を残し、案件担当は後ろの依頼だけを変えます。",
    view: "Atlasは、キャッシュで費用がどれだけ下がるかを書きません。下がる幅はプロバイダ、長さ、繰り返し方で変わり、公開ドキュメントも一律の節約額は約束していません。ここでの判断は、前置きと依頼を分けるかどうかです。",
    takeaway: "明日、一番よく使う指示を開き、先頭から「どの案件でも同じ文」に線を引いてください。案件で変わる名詞がその中にあれば後ろへ移し、前置きだけを別名で保存します。保存した前置きは、案件の文面とは別の場所に置きます。",
  }),
  tip({
    id: "long-context",
    title: "長い文脈は、判断に使うページだけ残す",
    summary: "窓が大きいからといって、資料一式を渡す必要はありません。入れるページを選ぶ手順です。",
    sourceTitle: "Prompt engineering guide",
    sourceSummary: "Prompt engineering guidance treats extra context as something to select carefully, because irrelevant text can distract the model from the actual task.",
    sourceUrls: ["https://platform.openai.com/docs/guides/prompt-engineering"],
    workflow: null,
    thesis: "長いコンテキストは、モデルが資料全体を読んだことにはなりません。関係のない章が入るほど、必要な条件は埋もれます。先に「この判断に使うページ」を人が選び、それ以外は渡しません。",
    change: "契約、マニュアル、過去メールをまとめて貼る前に、見出しを三つまで選びます。選んだ理由を一行で書けるものだけを残します。理由が書けない章は、今回の依頼から外します。検索で当たった断片も、前後の条件が切れていないかを見ます。",
    why: "全部を渡す方が漏れが少ないように感じます。実際には、モデルは目立つ段落に寄ります。人が選んだ短い束の方が、抜けを探す場所が限定され、レビューも速くなります。長い窓は、選んだあとに足りないときのための余裕です。",
    detail: "選ぶ単位はファイル名ではなく、判断に使う見出しです。契約なら該当条項、マニュアルならその手順、メールなら依頼が書かれた段落です。見出しを三つに限ると、外したものが本当に必要だったかを次の一回で確認できます。",
    work: "法務は該当条項、営業は提案の約束事項、サポートは既知の回避策だけを渡します。部署の共有フォルダをそのまま添付する運用は、下書き用の例外にします。通常の依頼はページ指定から始めます。",
    view: "Atlasは、長い入力が常に精度を上げるとは扱いません。公式のガイドが注意しているのは、余った文脈が課題から注意をそらすことです。記事の結論は、窓の大きさより選ぶページです。",
    takeaway: "明日の依頼で、貼っている資料の見出しを書き出し、判断に使うものだけ残してください。外した見出しで結果が変わらないかを、同じ質問でもう一度見ます。変わる見出しだけを戻し、戻した見出しは次の依頼でも最初から残します。",
  }),
  tip({
    id: "human-review",
    title: "外に出す文章は、人とモデルで役割を分ける",
    summary: "下書きと送信を同じ人の確認なしに繋がないための、レビューの置き方です。",
    sourceTitle: "AI risk management framework",
    sourceSummary: "The NIST AI Risk Management Framework describes human roles and oversight as part of using an AI system, rather than treating a model output as a finished action.",
    sourceUrls: ["https://www.nist.gov/itl/ai-risk-management-framework"],
    workflow: "ai-customer-response-assistant",
    thesis: "人が見るべきなのは、モデルが自信なさそうなときだけではありません。外に出る、お金が動く、約束が残る、個人の情報を含む。この四つのどれかに当たる出力は、下書きと送信を分けます。",
    change: "モデルの出力は候補として受け取り、送信ボタンは別の操作にします。確認する人は、条件、宛先、禁止している言い回しだけを見ます。全文の語感を直すことがレビューではありません。直す欄を先に決めておきます。",
    why: "同じ人が下書きと送信を続けると、確認は流れていきます。役割を分けると、モデルは候補を出し、人は外に出してよいかを判断します。例外だけを人が一から書く運用に戻す必要はありません。",
    detail: "見る欄は全文の語感ではありません。宛先、約束した期日、言ってはいけない条件の三つです。この三つが揃っている候補は送り、揃っていない候補は戻します。戻す理由を一行残すと、次の入力からその条件を外せます。戻した理由が同じ週に二度出たら、指示文の前置きへ移します。",
    work: "サポートの顧客返答、営業の見積条件、経理の支払い案内はレビュー対象です。社内の下書きメモやラベル候補は、外に出ない限りレビューを軽くできます。担当表に「出す人」と「確認する人」を別の名前で書きます。",
    view: "Atlasは、人の確認を精神論にしません。NISTの枠組みが置いているのは、システムの中での人の役割です。記事ではそれを、送信前に見る欄のリストに落としています。確認を省く自動化は勧めていません。",
    takeaway: "明日、顧客に出すテンプレを一つ選び、送信前に見る欄を三つに限ってください。宛先、約束している期日、言ってはいけない条件です。その三つが揃うまで送信しない、と手順に一行足し、欄は送信の直前に見える形にします。揃ったことと、誰が見たかを同じ行に残します。",
  }),
  tip({
    id: "role-workflows",
    title: "部署ごとに、繰り返す一段だけを任せる",
    summary: "営業、業務、経理、サポートで、最初に任せる作業を一つに絞る考え方です。",
    sourceTitle: "Production best practices",
    sourceSummary: "Production best-practice documentation recommends evaluating a concrete task before expanding a model into a broader workflow.",
    sourceUrls: ["https://platform.openai.com/docs/guides/production-best-practices"],
    workflow: null,
    thesis: "部署横断のAI活用は、四つの仕事を同時に始める計画になりがちです。続くのは、営業、業務、経理、サポートのどれかで、毎週同じ入力と同じ出力がある一段だけを任せる始め方です。",
    change: "営業なら次回アクションの下書き、業務なら手順の抜け出し、経理なら請求行の科目候補、サポートなら問い合わせ種別の分類。各部署で一つに決め、ほかの工程は人が今まで通りやります。入力の欄と、人が直す欄を紙に書きます。",
    why: "一度に全体を繋ぐと、どこで間違えたかが分かりません。一段なら、直した例を次の週の見本にできます。見本が十件たまってから、隣の工程へ進むかどうかを判断します。",
    detail: "営業は次の行動の文面、業務は手順の抜け、経理は科目の候補、サポートは問い合わせの種別。同じ週に二つを始めません。入力の形が週ごとに変わったら、その週は改善ではなく別の作業として止めます。止めた週は、見本を増やさず、入力の形を戻してから再開します。",
    work: "各部署の担当は、その一段の入力を同じ形式で残します。営業は会話メモ、業務はチェックリスト、経理は明細、サポートは受信文です。形式が週ごとに変わると、改善ではなく別の作業になります。",
    view: "Atlasは、四部署に同じツールを配ることを成功とは見ません。公式の運用ガイドが先に求めているのは、具体的な課題での評価です。記事の単位は部署名ではなく、繰り返す一段です。",
    takeaway: "明日、四つの部署から候補を一つずつ出し、今週手を付けるのはそのうち一件だけにしてください。入力欄、出力欄、人が直す欄を三行で書き、その三行以外の自動化は今週入れません。選ばなかった候補は、今週の手順には書かず、来週の候補一覧に残します。",
  }),
  tip({
    id: "implementation-mistakes",
    title: "AI導入で先に直す、よくある三段のミス",
    summary: "資料を全部渡す、確認を省く、モデルを毎週替える。この三つを先に止めます。",
    sourceTitle: "Latency and task design notes",
    sourceSummary: "Latency guidance discusses choosing a model and a task shape deliberately, instead of changing the setup whenever an output feels disappointing.",
    sourceUrls: ["https://platform.openai.com/docs/guides/latency-optimization"],
    workflow: null,
    thesis: "実装が止まるときは、モデルの名前より先に三段を見ます。資料を丸ごと渡している、確認する人を決めていない、結果が悪い週にモデルだけを替えている。このどれかがあると、次のモデルでも同じ失敗が再現します。",
    change: "一週間はモデルを固定します。その間に直すのは、入力から外す段落、出力の欄、人が見る条件です。モデルを替えるのは、同じ例で入力と欄を固定したあとに、抜け方が変わらないときだけにします。",
    why: "モデルを替えると、何が効いたかが消え、担当者はプロンプトを足し続けます。プロンプトが長くなるほど、前のミスは残ったままです。固定した比較がないと、高いモデルへ移ること自体が対策に見えてしまいます。",
    detail: "一週間の固定中に直してよいのは、外す段落、出力の欄、人が見る条件です。モデル名を変えた記録が同じ週にある失敗は、原因を切り分けられません。その失敗は、同じモデルでもう一度出してから分類します。",
    work: "導入の担当は、失敗した例を三件残します。渡しすぎ、確認漏れ、モデル変更のどれだったかを一行で分類します。分類できない失敗は、まだ手順に落ちていません。営業も経理も、この三分類を共有します。",
    view: "Atlasは失敗の割合を作りません。公開のガイドが示しているのは、課題の形とモデルの選択を分けて考えることです。記事はその分け方を、一週間モデルを固定するルールにしています。",
    takeaway: "明日、直近で使わなくなったプロンプトを一つ開き、失敗の原因を「渡しすぎ」「確認漏れ」「モデルを替えた」のどれかに書いてください。書けないものは、入力を半分にして同じモデルでもう一度出します。書いた一行は、指示文の末尾ではなく手順の横に残します。",
  }),
  tip({
    id: "semi-automation",
    title: "全自動の前に、人が止める一段を残す",
    summary: "最初から送信まで繋がない。候補を出し、人が次の操作を選ぶ始め方です。",
    sourceTitle: "NIST AI resource center",
    sourceSummary: "The NIST AI resource center frames risk management as an ongoing practice, including where people remain responsible for the system's outcomes.",
    sourceUrls: ["https://airc.nist.gov/"],
    workflow: null,
    thesis: "全自動は、止まってよい場所がない作業に向きます。顧客への送信、支払い、契約の更新は、最初から繋がない方が安全です。半自動は、モデルが候補を出し、人が次の操作を選ぶところまでを一つの手順にします。",
    change: "出力の行き先を「下書きフォルダ」か「担当者の確認待ち」に固定します。送信、転記、承認は別のボタンのままにします。自動で進めてよいのは、外に出ないラベル付けと、社内メモの整理だけです。",
    why: "最初に全自動へすると、例外のたびに仕組みを止め、担当者は手作業に戻ります。半自動で十件の直し方が残ってからなら、どの条件なら次の一段を繋いでよいかを言えます。繋ぐ条件が言えないうちは、ボタンを分けたままにします。",
    detail: "繋いでよい条件は、外に出ないこと、お金が動かないこと、後から人が取り消せることです。三つが揃わない操作は、候補を置くところまでです。止めた理由が毎週同じなら、その入力を最初から渡さないようにします。渡さない入力は、手順の先頭に一行で書いておきます。",
    work: "サポートは返信候補、経理は科目候補、営業は次の行動の文面を確認待ちに置きます。管理する人は、自動で進んだ件数ではなく、人が止めた理由を週に一度見ます。止めた理由が同じなら、その条件を入力側で外します。",
    view: "Atlasは半自動を消極的な妥協とは見ません。NISTの資料が繰り返しているのは、結果の責任は人に残るということです。記事ではその責任を、送信ボタンを分けておくという具体的な操作にしています。",
    takeaway: "明日、いま繋ごうとしている自動化を一つ選び、最後の操作を人のボタンに戻してください。モデルが作るのは候補までです。そのボタンを押した人の名前が残る形にしてから、次の十件を回します。名前が残らない操作は、まだ繋がない対象のままにします。",
  }),
];

function weekNumber(weekKey: string): number {
  const match = /W(\d{1,2})/i.exec(weekKey);
  return match ? Number(match[1]) : 0;
}

export function tipByUrl(url: string): TipTopic | undefined {
  return TIP_TOPICS.find((topic) => topic.sourceUrls[0] === url);
}

/** One tip per week. Skips a topic whose documentation URL is already queued. */
export function chooseTip(weekKey: string, knownUrls: readonly string[]): TipTopic | null {
  if (TIP_TOPICS.length === 0) return null;
  const known = new Set(knownUrls);
  const start = weekNumber(weekKey) % TIP_TOPICS.length;
  for (let offset = 0; offset < TIP_TOPICS.length; offset += 1) {
    const topic = TIP_TOPICS[(start + offset) % TIP_TOPICS.length];
    if (!known.has(topic.sourceUrls[0])) return topic;
  }
  return null;
}

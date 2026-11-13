import type { JapanesePipelineCopy } from "./copy-types";

const YOU_SEND_IT =
  "送るのはあなたです。自動では送信もCRM書き込みもしません。";
const DO_NOT_INVENT = "連絡先、異議、期限は作らないでください。";
const STALL_NOT_PROOF =
  "停滞の印は、買い手が興味を失った証拠にはなりません。書き出しで活動がない、または次の一手が空欄なだけです。";
const SKIP_RULES_FIRST = "先にスキップルール";
const LOGGED_ON_HOLD = "記録上 on-hold の商談は、もう追いかけません。";

function formatSkipStatusesJa(statuses: string[]): string {
  if (statuses.length === 0) return "";
  if (statuses.length === 1) return `${statuses[0]} は外す。`;
  if (statuses.length === 2) return `${statuses[0]} と ${statuses[1]} は外す。`;
  const head = statuses.slice(0, -1).join("、");
  return `${head}、および ${statuses[statuses.length - 1]} は外す。`;
}

export const japanesePipelineCopy: JapanesePipelineCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "停滞商談の確認",
  publicBody:
    "開いている商談の書き出しから、スキップルール付きの停滞キューを金額順に作り、書き出しの項目だけから救出メモの下書きを出します。AIは準備します。確認と対応は自分のCRMまたはメールから行います。自動では送信もCRM書き込みもしません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "商談の書き出しに書いてある事実です。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  skippedHelp: "停滞キューの前に、スキップルールで外した行です。",
  fictionalNotice:
    "この画面の商談、会社名、金額、ステージ、活動日、日付はすべて架空です。実在の顧客やパイプラインデータは使いません。HubSpot、Pipedrive、Salesforce、メール、その他のライブシステムにはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "書き出し",
    "先にスキップルール",
    "並べた停滞キュー",
    "数字を確認する",
    "来週の記録",
    "送るのはあなた",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "止まりそうな商談プレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で開いている商談の書き出しを確認するためのプロンプト、ワークシート、チェックリストです。AIはスキップルールを適用し、書き出しの項目だけから救出メモを下書きします。送るのはあなたです。自動では送信もCRM書き込みもしません。",
  planDifferenceNotice:
    "ChatGPT、Claude、Gemini のファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
  sessionOnlyNotice:
    "ワークシートの入力とチェックの進み具合は、このブラウザのセッションにだけ残り、Atlas には保存されません。",
  kitNavLabel: "キットの内容",
  inThisKit: "このキットの内容",
  backToDemo: "ガイドに戻る",
  lockedEyebrow: "プライベートプレビュー",
  lockedTitle: "Premiumはロックされています",
  lockedBody:
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。送るのはあなたです。自動では送信もCRM書き込みもしません。",
  demo: {
    step1Lead:
      "この商談表は架空です。HubSpot、Pipedrive、Salesforce、CRM、メールとはつながっていません。Atlas は接続も、アップロードも、送信もしません。",
    asOfLabel: "as_of（架空）",
    minimumLabel: "owner_minimum",
    stallLimitsLabel: "stall limits（日）",
    stallLimitsValue: "ステージ14日、または活動から14日、あるいは次の一手が空欄",
    exportHeading: "開いている商談（架空）",
    exportTableLabel: "開いている商談",
    step2Lead:
      "停滞の判定、並べ替え、救出メモの下書きの前に、スキップルールを先に適用します。外した行には理由を残します。",
    skipped: [
      "Birchwood retainers（金額 $400 は最小額 $500 未満）。",
      "Pell & Co monthly books（最終活動 2026-05-09、次の一手あり。ルール上は停滞ではない）。",
    ],
    skippedStatusRules:
      "closed-won、closed-lost、on-hold もスキップルールです。この書き出しに該当行がなくても適用します。",
    step3Lead:
      "残った開いている商談のうち、書いた停滞ルールに当てはまるものは金額の大きい順です。この書き出しでは確認する行は2件です。",
    queueHeading: "STALL QUEUE as of 2026-05-11（架空；確認2件、外した2件）",
    queueTableLabel: "並べた停滞キュー",
    confirmedNorthgate:
      "Northgate Clinic website rebuild、$8,400、proposal、ステージ21日。最終活動 2026-04-18；次の一手 空欄。",
    northgateDraft:
      "4月18日に最後に触れた $8,400 のウェブサイト改修の提案について確認です。まだ話す価値はありますか？",
    confirmedHarbor:
      "Harbor Lane discovery、$1,500、qualified、ステージ45日。最終活動 2026-03-20；次の一手 空欄。",
    harborDraft:
      "$1,500 の Harbor Lane のヒアリングは、3月20日以降の活動記録がありません。クローズしますか、次の一手を決めますか？",
    interpretation: STALL_NOT_PROOF,
    recommended: `自分のメールで編集して送るか、自分のCRMで次の一手を更新してください。${YOU_SEND_IT} ${DO_NOT_INVENT}`,
    doNotInvent: DO_NOT_INVENT,
    step4Lead:
      "誰かが救出メモを送る前に、Northgate Clinic の確認済みの数字を書き出しの行と突き合わせます。",
    factButton: "書き出しの行と数字を照合する",
    factTableLabel: "書き出しの行との照合",
    factColumns: ["項目", "下書きの値", "書き出しの行", "結果"],
    factResult: "一致",
    step5Lead:
      "オーナーが結果を記録したあと、次の実行は新しい書き出しと、この結果ログから始めます。",
    outcomeHeading: "2026-05-11 の週の結果ログ（架空）",
    outcomeTableLabel: "結果ログ",
    nextWeekHeading: "架空の次回実行 as of 2026-05-18",
    stillQueued:
      "1. Northgate Clinic website rebuild はまだキューに残る（outcome still_stalled）。",
    nextWeekSkipped: [
      "Harbor Lane discovery（記録上 on_hold）。",
      "Pell & Co monthly books（最終活動 2026-05-09、次の一手あり。ルール上は停滞ではない）。",
      "Birchwood retainers（金額 $400 は最小額 $500 未満）。",
    ],
    loggedOnHold: LOGGED_ON_HOLD,
    step6Title: YOU_SEND_IT,
    step6Body:
      "自分のメールで編集して送るか、自分のCRMで次の一手を更新するか、送らないと決めます。送信、編集、取消、支払いは自動では行いません。",
    step6Boundary:
      "Atlas は HubSpot、Pipedrive、Salesforce、メールには接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "停滞キューの準備",
      intro:
        "週1回の停滞確認は、この順で進めます。本番のパイプライン書き出しの前に、架空の商談書き出しで練習してください。",
    },
    {
      id: "stall-queue-prompt",
      title: "停滞キューのプロンプト",
      intro:
        "ルールと一緒にこのプロンプトを貼り、開いている商談の書き出しと先週の結果ログを貼ります。先にスキップルールを適用し、残った行を金額順に並べ、確認済みとAIの解釈を分けます。",
    },
    {
      id: "next-week-prompt",
      title: "週ごとの結果ログ用プロンプト",
      intro:
        "翌週、新しい書き出しと今の結果ログと一緒に貼ります。ログの outcome が lost または on_hold の行は外し、still_stalled の行はログの確認済みとして残します。",
    },
    {
      id: "rules-worksheet",
      title: "停滞の上限とスキップルールのワークシート",
      intro:
        "停滞の上限、オーナーの最小金額、追いかけないステータス、常に外す商談を書きます。できたルールはプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "outcome-log-template",
      title: "結果ログのひな形",
      intro:
        "ガイドと同じ、架空の Harbor Lane on_hold と Northgate still_stalled の行です。outcome の値は moved、still_stalled、lost、on_hold、skipped_not_stalled、skipped_below_minimum、skipped_closed です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "recovery-review-checklist",
      title: "救出メモの確認リスト",
      intro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
    },
    {
      id: "sample-deal-export",
      title: "架空の商談書き出し",
      intro:
        "ガイドと同じ、架空の4行の商談 CSV です。プロンプトと一緒に貼って、本番の前に練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "キューの前に停滞の上限とスキップルールを書きます。ステージ滞在日数の上限、最終活動からの日数の上限、オーナーの最小金額、追いかけないステータス（既定は closed-won、closed-lost、on-hold）、常に外す商談です。上限、最小額、追いかけないステータスや商談は人が決めます。",
    "開いている商談を CSV で書き出します。商談名、金額、ステージ、現ステージ日数、最終活動日、次の一手、クローズ日、ステータス、書き出しの as-of 日を含めます。先週の結果ログも開きます。残す列は人が選びます。メール、電話、この手順に不要な列は消します。これは書き出しの確認です。HubSpot、Pipedrive、Salesforce、メールとの接続ではありません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。ファイルを渡せないときや渡したくないときは、行を文字で貼るか、このデータにはAIを使いません。",
    "停滞キューのプロンプトと、停滞の上限とスキップルールのワークシートのルールを貼り、書き出しと結果ログを添付するか貼ります。",
    `AIは${SKIP_RULES_FIRST}を適用します。closed-won、closed-lost、オーナーが on-hold にした行、最小額未満、商談名や金額が欠けた行、常に外す一覧の商談を外します。外した行には理由を残します。最小額未満や on-hold をそれでも見るかは人が決めます。`,
    "救出メモの確認リストを使い、確認済みの数字を書き出しの行と突き合わせます。編集して自分のメールから送る、自分のCRMで次の一手を更新する、何もしないかは人が決めます。Blueprint は送信も、CRM項目の更新もしません。結果（moved、still_stalled、lost、on hold）は結果ログに書き、翌週の実行に使います。",
    "週ごとの結果ログ用プロンプトは、新しい書き出しと結果ログで停滞キューを再度回すときに使います。",
  ],
  stallQueuePrompt: `貼り付けた開いている商談の書き出しと停滞ルールから、停滞商談の救出キューを作る手伝いをしてください。準備するのはあなたです。決めるのは私です。

${SKIP_RULES_FIRST}。停滞の判定、並べ替え、救出メモの下書きの前にスキップルールを適用してください。先に並べて、あとから外してはいけません。

連絡先、異議、期限は作らないでください。送信しないでください。CRMの項目を書かないでください。自動では何も送らず、CRMにも書きません。

貼り付けるもの:
1. 停滞の上限とスキップルールのワークシートのルール
2. 開いている商談の書き出し（商談名、金額、ステージ、days_in_stage、last_activity、next_step、クローズ日、status、as-of 日）
3. 先週の結果ログ（あれば）

ルール
- 先頭に「${SKIP_RULES_FIRST}」と書く。
- status が closed-won、closed-lost、on-hold（または追いかけない一覧のステータス）の行は外す。理由は status <status>。
- 金額が最小額未満の行は外す。理由は amount $<amount> が最小額 $<minimum> 未満。
- 商談名または金額が欠けた行は外す。理由は商談名または金額が欠けている。要確認に入れ、キューには入れない。
- 常に外す一覧の商談は外す。理由は常に外す一覧。
- 残った開いている商談は、days_in_stage がステージ上限を超える、または last_activity が as_of より活動上限日数より古い、または next_step が空欄のとき停滞とする。当たった条件を示す。
- ルール上停滞でない残りの開いている商談は、理由「ルール上は停滞ではない」で外す。
- 停滞商談を金額の大きい順に並べる。同じ金額なら最終活動の古い順。
- 救出メモに使ってよいのは商談名、金額、ステージ、最終活動日だけ。連絡先の名前、メール、電話、異議、期限、競合は作らない。
- 停滞の印は、書き出しで活動がない、または次の一手が空欄であることの確認済みである。買い手が興味を失った証拠ではない。その注意はAIの解釈。
- 0〜100のリスク点数は作らない。書いた停滞ルールだけを使う。
- 下書きは下書きだけ。送らない。CRMの項目を編集しない。結果ログの行案を出す。追記するのは私。

出力
${SKIP_RULES_FIRST}
書き出しの as-of 日時点の STALL QUEUE
金額の大きい順の停滞商談。確認済みの項目と救出メモの下書きを1件ずつ。
外す: 外した行とその理由。
AIの解釈: これらの行は買い手が興味を失った証拠ではない。書き出しで活動がない、または次の一手が空欄なだけである。
推奨アクション（人が決める）: 自分のメールで編集して送るか、自分のCRMで次の一手を更新する。送るのはあなたです。自動では送信もCRM書き込みもしません。連絡先、異議、期限は作らない。

作らない。送らない。自動では送信もCRM書き込みもしません。`,
  stallQueuePromptIntro:
    "ルールと一緒にこのプロンプトを貼り、開いている商談の書き出しと先週の結果ログを貼ります。先にスキップルールを適用し、残った行を金額順に並べ、確認済みとAIの解釈を分けます。",
  nextWeekPrompt: `新しい書き出しと結果ログを使い、翌週の停滞キューを回す手伝いをしてください。準備するのはあなたです。決めるのは私です。

送信しないでください。CRMの項目を書かないでください。自動では送信もCRM書き込みもしません。

貼り付けるもの:
1. 停滞の上限とスキップルールのワークシートのルール
2. 新しい開いている商談の書き出し
3. 今の結果ログ

新しい書き出しと今の結果ログから始める。
ログの outcome が lost または on_hold の行は外す。
still_stalled と moved の行は、結果ログからの確認済みとして残す。
外した行には理由を残す。
送信しない。勝敗や失注を私の代わりに付けない。

出力
結果ログと新しい書き出しで${SKIP_RULES_FIRST}。
外す: ログ outcome が lost または on_hold の行と理由。
QUEUE: 残った停滞商談。still_stalled の行はログからの確認済みを付ける。
推奨アクション（人が決める）: 自分のメールで編集して送るか、自分のCRMで次の一手を更新する。送るのはあなたです。自動では送信もCRM書き込みもしません。

送らない。自動では送信もCRM書き込みもしません。`,
  nextWeekPromptIntro:
    "翌週、新しい書き出しと今の結果ログと一緒に貼ります。ログの outcome が lost または on_hold の行は外し、still_stalled の行はログの確認済みとして残します。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  daysInStageLabel: "ステージ滞在日数の上限",
  daysSinceActivityLabel: "最終活動からの日数の上限",
  minimumAmountLabel: "オーナーの最小金額（USD）",
  neverChaseLabel: "追いかけないステータス（1行に1つ）",
  alwaysSkipLabel: "常に外す商談（1行に1つ）",
  generateRules: "停滞ルールを作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの停滞ルール",
  copyRules: "ルールをコピー",
  stallLimitError: "1以上の停滞上限を入力してください。",
  minimumAmountError: "0以上の最小金額を入力してください。",
  reviewRules: ({
    daysInStageLimit,
    daysSinceActivityLimit,
    ownerMinimum,
    neverChaseStatuses,
    alwaysSkip,
  }) => {
    const lines = [
      ...(neverChaseStatuses.length > 0 ? [formatSkipStatusesJa(neverChaseStatuses)] : []),
      `金額が $${ownerMinimum} 未満は外す。`,
      ...alwaysSkip.map((name) => `常に外す: ${name}`),
      `商談は、days_in_stage が ${daysInStageLimit} を超える、または last_activity が as_of より ${daysSinceActivityLimit} 日より古い、または next_step が空欄のとき停滞とする。`,
      "金額の大きい順に並べる。",
      "救出メモに使ってよいのは商談名、金額、ステージ、最終活動日だけ。",
      DO_NOT_INVENT,
      "停滞の印は、買い手が興味を失った証拠にはなりません。",
      YOU_SEND_IT,
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "停滞の判定、並べ替え、救出メモの下書きの前に、先にスキップルールを適用した。",
    "外した行には、見える理由がある。",
    "残った停滞商談は、金額の大きい順である。",
    "確認済みの金額と日付は、書き出しの行と一致している。",
    "確認済み、AIの解釈、推奨アクションは分けて書いてある。",
    "救出メモは商談名、金額、ステージ、最終活動日だけを使っている。",
    "連絡先、異議、期限を作っていない。",
    "停滞の印を、買い手が興味を失った証拠や商談が終わった証拠にしていない。",
    "自分のメールから送るか、自分のCRMで次の一手を更新するか、送らないと決める。送るのはあなたです。自動では送信もCRM書き込みもしません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の実行の前にリストをリセットしてください。送るかCRMを更新するかは、自分で決めます。",
  sampleIntro:
    "ガイドと同じ、架空の4行の商談 CSV です。プロンプトと一緒に貼って、本番の前に練習します。",
  outcomeLogIntro:
    "ガイドと同じ、架空の Harbor Lane on_hold と Northgate still_stalled の行です。outcome の値は moved、still_stalled、lost、on_hold、skipped_not_stalled、skipped_below_minimum、skipped_closed です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
  fictionalBadge: "架空",
  safetyRules: [
    "商談の書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "メール、電話など、この手順に不要な列は消します。",
    "パスワード、カード番号、口座番号はAIに貼りません。",
    DO_NOT_INVENT,
    "停滞の印を、商談が終わった証拠や買い手が興味を失った証拠にしてはいけません。",
    "記録上 lost または on-hold の商談は追いかけません。",
    `${YOU_SEND_IT}送信、編集、取消、支払いは自動では行いません。`,
    "Atlas は HubSpot、Pipedrive、Salesforce、メール、その他のサービスには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

import type { JapaneseProposalCopy } from "./copy-types";

const YOU_SEND_IT = "送るのはあなたです。自動では送信しません。";
const DO_NOT_INVENT = "異議、競合名、期限は作らないでください。";
const SILENCE_NOT_PROOF = "沈黙は買う証拠でも、断った証拠でもありません。";
const SKIP_RULES_FIRST = "先にスキップルール";
const LOGGED_DECLINED = "記録上 declined の提案は、もう追いかけません。";

function formatSkipStatusesJa(statuses: string[]): string {
  if (statuses.length === 0) return "";
  if (statuses.length === 1) return `${statuses[0]} は外す。`;
  if (statuses.length === 2) return `${statuses[0]} と ${statuses[1]} は外す。`;
  const head = statuses.slice(0, -1).join("、");
  return `${head}、および ${statuses[statuses.length - 1]} は外す。`;
}

export const japaneseProposalCopy: JapaneseProposalCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "提案フォローの下書き",
  publicBody:
    "送付済み提案の書き出しから、スキップルールと書いたペースで沈黙キューを作り、使える項目だけからフォローの下書きを出します。AIは準備します。確認、編集、送信は自分のメールから行います。自動では送信しません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "提案の書き出しに書いてある事実です。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  skippedHelp: "沈黙キューの前に、スキップルールで外した行です。",
  fictionalNotice:
    "この画面の提案、顧客名、金額、送信日、ステータス、日付はすべて架空です。実在の顧客や提案データは使いません。CRM、PandaDoc、DocuSign、メール、表計算、その他のライブシステムにはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "書き出し",
    "先にスキップルール",
    "並べた沈黙キュー",
    "数字を確認する",
    "来週の記録",
    "送るのはあなた",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "提案後のフォロープレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で送付済み提案の書き出しを確認するためのプロンプト、ワークシート、チェックリストです。AIはスキップルールを適用し、書き出しの項目だけからフォローを下書きします。送るのはあなたです。自動では送信しません。",
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
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。送るのはあなたです。自動では送信しません。",
  demo: {
    step1Lead:
      "この提案表は架空です。CRM、PandaDoc、DocuSign、メール、表計算とはつながっていません。Atlas は接続も、アップロードも、送信もしません。",
    asOfLabel: "as_of（架空）",
    silenceLabel: "silence_if_sent_before",
    minimumLabel: "owner_minimum",
    cadenceLabel: "cadence",
    exportHeading: "送付済み提案（架空）",
    exportTableLabel: "送付済み提案",
    step2Lead:
      "並べ替え、ペースの割り当て、フォローの下書きの前に、スキップルールを先に適用します。外した行には理由を残します。",
    skipped: [
      "P-448 Pell & Co（送信日 2026-05-16 は沈黙日 2026-05-13 以降）。",
      "P-430 Harbor Lane（status が declined）。",
      "P-452 Birchwood（金額 $400 は最小額 $1,000 未満）。",
    ],
    skippedStatusRules:
      "won と on-hold もスキップルールです。この書き出しに該当行がなくても適用します。",
    step3Lead:
      "残った沈黙の提案は、金額の大きい順、同じ金額なら送信からの日数の長い順です。この書き出しでは追いかけるのは1件です。",
    queueHeading: "QUEUE as of 2026-05-18（架空；追いかける1件、外した3件）",
    queueTableLabel: "並べた沈黙キュー",
    confirmedLine:
      "P-441 Northgate Clinic、$8,400、送信 2026-04-27（21日）。status sent；last inbound 空欄；明細 website rebuild。ペース: close-the-loop。",
    draftText:
      "2026年4月27日にお送りした提案 P-441（$8,400、website rebuild）のご確認です。このまま開けておきますか、それとも一旦閉じますか？",
    interpretation: SILENCE_NOT_PROOF,
    recommended: `自分のメールで編集して送ってください。${YOU_SEND_IT} ${DO_NOT_INVENT}`,
    doNotInvent: DO_NOT_INVENT,
    step4Lead:
      "誰かがフォローを送る前に、P-441 の確認済みの数字を書き出しの行と突き合わせます。",
    factButton: "書き出しの行と数字を照合する",
    factTableLabel: "書き出しの行との照合",
    factColumns: ["項目", "下書きの値", "書き出しの行", "結果"],
    factResult: "一致",
    step5Lead:
      "オーナーが結果を記録したあと、次の実行は新しい書き出しと、この結果ログから始めます。",
    outcomeHeading: "2026-05-18 の週の結果ログ（架空）",
    outcomeTableLabel: "結果ログ",
    nextWeekHeading: "架空の次回実行 as of 2026-05-25",
    stillQueued: "1. P-441 Northgate Clinic はまだキューに残る（outcome still_silent）。",
    nextWeekSkipped: [
      "P-430 Harbor Lane（記録上 declined）。",
      "P-448 Pell & Co（新しい as_of と沈黙日で再確認）。",
      "P-452 Birchwood（金額 $400 は最小額 $1,000 未満）。",
    ],
    loggedDeclined: LOGGED_DECLINED,
    step6Title: YOU_SEND_IT,
    step6Body:
      "自分のメールで編集して送るか、送らないと決めます。送信、編集、取消、支払いは自動では行いません。",
    step6Boundary:
      "Atlas は CRM、PandaDoc、DocuSign、メール、表計算には接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "沈黙キューの準備",
      intro:
        "週1回の沈黙確認は、この順で進めます。本番の提案書き出しの前に、架空の提案書き出しで練習してください。",
    },
    {
      id: "silence-queue-prompt",
      title: "沈黙キューのプロンプト",
      intro:
        "ルールと一緒にこのプロンプトを貼り、送付済み提案の書き出しと先週の結果ログを貼ります。先にスキップルールを適用し、残った行を金額順に並べ、確認済みとAIの解釈を分けます。",
    },
    {
      id: "next-week-prompt",
      title: "翌週の結果ログ用プロンプト",
      intro:
        "翌週、新しい書き出しと今の結果ログと一緒に貼ります。ログの outcome が declined、lost、on_hold の行は外し、still_silent の行はログの確認済みとして残します。",
    },
    {
      id: "rules-worksheet",
      title: "沈黙の基準日とペースのワークシート",
      intro:
        "silence_if_sent_before の日付、オーナーの最小金額、追いかけないステータス、ペースの階段を書きます。できたルールはプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "outcome-log-template",
      title: "結果ログのひな形",
      intro:
        "ガイドと同じ、架空の P-441 still_silent と P-430 declined の行です。outcome の値は replied、still_silent、lost、declined、on_hold、skipped_too_recent、skipped_below_minimum、skipped_won、skipped_already_followed_up です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "follow-up-review-checklist",
      title: "フォロー前の確認リスト",
      intro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
    },
    {
      id: "sample-proposal-export",
      title: "架空の提案書き出し",
      intro:
        "ガイドと同じ、架空の4行の提案 CSV です。プロンプトと一緒に貼って、本番の前に練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "キューの前に沈黙ルールとペースを書きます。silence_if_sent_before の日付（または沈黙日数）、オーナーの最小金額、追いかけないステータス（既定は declined、won、on-hold）、フォローのペース階段（例: 5-11日 recap、12-20日 check-in、21日以上 close-the-loop）です。沈黙日、最小額、追いかけないステータス、ペースは人が決めます。",
    "送付済み提案を CSV で書き出します。提案ID、顧客、金額、送信日、ステータス、最終受信日、クローズ日、明細1行、書き出しの as-of 日を含めます。先週の結果ログも開きます。残す列は人が選びます。メール、電話、この手順に不要な列は消します。これは書き出しの確認です。CRM、PandaDoc、DocuSign、メール、表計算との接続ではありません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。ファイルを渡せないときや渡したくないときは、行を文字で貼るか、このデータにはAIを使いません。",
    "沈黙キューのプロンプトと、沈黙の基準日とペースのワークシートのルールを貼り、書き出しと結果ログを添付するか貼ります。",
    `AIは${SKIP_RULES_FIRST}を適用します。declined、won、オーナーが on-hold にした行、結果ログで今期すでにフォロー済みの行、沈黙日以降に送った行、最小額未満、提案IDや金額が欠けた行を外します。外した行には理由を残します。最小額未満や on-hold をそれでも見るかは人が決めます。`,
    "フォロー前の確認リストを使い、確認済みの数字を書き出しの行と突き合わせます。編集して自分のメールから送る、保留する、lost や declined にする、何もしないかは人が決めます。キットは送信も、トラッカーの項目更新もしません。結果（replied、still_silent、lost、declined、on hold）は結果ログに書き、翌週の実行に使います。",
  ],
  silenceQueuePrompt: `貼り付けた送付済み提案の書き出しと沈黙ルールから、静かな追いかけキューを作る手伝いをしてください。準備するのはあなたです。決めるのは私です。

${SKIP_RULES_FIRST}。並べ替え、ペースの割り当て、フォローの下書きの前にスキップルールを適用してください。先に並べて、あとから外してはいけません。

異議、競合、割引、期限は作らないでください。送信しないでください。トラッカーの項目を書かないでください。自動では何も送りません。

貼り付けるもの:
1. 沈黙の基準日とペースのワークシートのルール（silence_if_sent_before、オーナー最小額、追いかけないステータス、ペース階段）
2. 送付済み提案の書き出し（提案ID、顧客、金額、sent_date、status、last_inbound、クローズ日、line_item、as-of 日）
3. 先週の結果ログ（あれば）

ルール
- 先頭に「${SKIP_RULES_FIRST}」と書く。
- status が declined、won、on-hold（または追いかけない一覧のステータス）の行は外す。理由は status <status>。
- 結果ログで今期すでにフォロー済みの行は外す。理由は今期すでにフォロー済み。
- sent_date が silence_if_sent_before 以降の行は外す。理由は sent <date> が沈黙日 <date> 以降。
- 金額が最小額未満の行は外す。理由は amount $<amount> が最小額 $<minimum> 未満。
- 提案IDまたは金額が欠けた行は外す。理由は提案IDまたは金額が欠けている。要確認に入れ、キューには入れない。
- 残った沈黙の提案を金額の大きい順に並べる。同じ金額なら送信日の古い順。
- 書いたペース階段と、as_of 時点の送信からの日数でペースを割り当てる。既定: 5-11日 recap；12-20日 check-in；21日以上 close-the-loop。当たった区分を示す。
- 下書きに使ってよいのは提案ID、金額、送信日、書き出しの明細1行だけ。異議、競合名、割引、急かす期限、連絡先のメールや電話は作らない。
- 沈黙は書き出しで受信返信がないことの確認済みである。関心の証明でも、失注の証明でもない。その注意はAIの解釈。
- 下書きは下書きだけ。送らない。CRMや提案トラッカーの項目を編集しない。結果ログの行案を出す。追記するのは私。

出力
${SKIP_RULES_FIRST}
書き出しの as-of 日時点の QUEUE
金額の大きい順の沈黙提案。確認済みの項目、ペース段階、フォロー下書きを1件ずつ。
外す: 外した行とその理由。
AIの解釈: 沈黙は買う証拠でも、断った証拠でもない。
推奨アクション（人が決める）: 自分のメールで編集して送る。送るのはあなたです。自動では送信しません。異議、競合、期限は作らない。

作らない。送らない。自動では送信しません。`,
  silenceQueuePromptIntro:
    "ルールと一緒にこのプロンプトを貼り、送付済み提案の書き出しと先週の結果ログを貼ります。先にスキップルールを適用し、残った行を金額順に並べ、確認済みとAIの解釈を分けます。",
  nextWeekPrompt: `新しい書き出しと結果ログを使い、翌週の沈黙キューを回す手伝いをしてください。準備するのはあなたです。決めるのは私です。

送信しないでください。トラッカーの項目を書かないでください。自動では送信しません。

貼り付けるもの:
1. 沈黙の基準日とペースのワークシートのルール
2. 新しい送付済み提案の書き出し
3. 今の結果ログ

新しい書き出しと今の結果ログから始める。
ログの outcome が declined、lost、on_hold の行は外す。
still_silent と replied の行は、結果ログからの確認済みとして残す。
外した行には理由を残す。
送信しない。勝敗や失注を私の代わりに付けない。

出力
結果ログと新しい書き出しで${SKIP_RULES_FIRST}。
外す: ログ outcome が declined、lost、on_hold の行と理由。
QUEUE: 残った沈黙の提案。still_silent の行はログからの確認済みを付ける。
推奨アクション（人が決める）: 自分のメールで編集して送る。送るのはあなたです。自動では送信しません。

送らない。自動では送信しません。`,
  nextWeekPromptIntro:
    "翌週、新しい書き出しと今の結果ログと一緒に貼ります。ログの outcome が declined、lost、on_hold の行は外し、still_silent の行はログの確認済みとして残します。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  silenceDateLabel: "この日より前に送った提案を沈黙対象にする（YYYY-MM-DD）",
  minimumAmountLabel: "オーナーの最小金額（USD）",
  neverChaseLabel: "追いかけないステータス（1行に1つ）",
  cadenceLabel: "ペースの階段",
  generateRules: "沈黙ルールを作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの沈黙ルール",
  copyRules: "ルールをコピー",
  silenceDateError: "沈黙日（YYYY-MM-DD）を入力してください。",
  minimumAmountError: "0以上の最小金額を入力してください。",
  reviewRules: ({ silenceIfSentBefore, ownerMinimum, neverChaseStatuses, cadenceLadder }) => {
    const lines = [
      ...(neverChaseStatuses.length > 0 ? [formatSkipStatusesJa(neverChaseStatuses)] : []),
      `金額が $${ownerMinimum} 未満は外す。`,
      `送信日が ${silenceIfSentBefore} 以降の提案は外す。`,
      `ペース: ${cadenceLadder}。`,
      "金額の大きい順、同じ金額なら送信からの日数の長い順。",
      "下書きに使ってよいのは提案ID、金額、送信日、明細1行だけ。",
      DO_NOT_INVENT,
      SILENCE_NOT_PROOF,
      YOU_SEND_IT,
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "並べ替え、ペースの割り当て、フォロー下書きの前に、先にスキップルールを適用した。",
    "外した行には、見える理由がある。",
    "残った沈黙の提案は、金額の大きい順、その次に送信からの日数順である。",
    "ペース段階は、送信からの日数に対する書いた階段と一致している。",
    "確認済みの金額と日付は、書き出しの行と一致している。",
    "確認済み、AIの解釈、推奨アクションは分けて書いてある。",
    "下書きは提案ID、金額、送信日、明細1行だけを使っている。",
    "異議、競合、期限を作っておらず、沈黙を興味や失注の証明にしていない。",
    "自分のメールから送るか、送らないと決める。送るのはあなたです。自動では送信しません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の実行の前にリストをリセットしてください。送るかどうかは、自分のメールで自分で決めます。",
  sampleIntro:
    "ガイドと同じ、架空の4行の提案 CSV です。プロンプトと一緒に貼って、本番の前に練習します。",
  outcomeLogIntro:
    "ガイドと同じ、架空の P-441 still_silent と P-430 declined の行です。outcome の値は replied、still_silent、lost、declined、on_hold、skipped_too_recent、skipped_below_minimum、skipped_won、skipped_already_followed_up です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
  fictionalBadge: "架空",
  safetyRules: [
    "提案の書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "メール、電話など、この手順に不要な列は消します。",
    "パスワード、カード番号、口座番号はAIに貼りません。",
    DO_NOT_INVENT,
    SILENCE_NOT_PROOF,
    "記録上 declined、lost、on-hold の提案は追いかけません。",
    `${YOU_SEND_IT}送信、編集、取消、支払いは自動では行いません。`,
    "Atlas は CRM、PandaDoc、DocuSign、メール、表計算、その他のサービスには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

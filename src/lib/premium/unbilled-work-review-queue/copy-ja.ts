import type { JapaneseUnbilledCopy } from "./copy-types";

const YOU_CREATE =
  "請求書はあなたが作ります。送信も入金回収もしません。";

const DO_NOT_ADD_TAX = "書き出しにない税や支払条件は付けません。";

const NO_AUTOMATIC =
  "請求書の送信、入金記録、会計ソフトの変更は自動では行いません。";

export const japaneseUnbilledCopy: JapaneseUnbilledCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "未請求作業レビュー",
  publicBody:
    "仕事や工数のCSVから、スキップルール付きの未請求キューを作り、古い完了日から並べて、書き出しの項目だけの請求下書きを出します。AIは準備します。請求する・保留する・償却するかは人が決めます。送信も入金回収もしません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "仕事の書き出しや請求ログに書いてある事実です。",
  needsCheckHelp: "足りない項目です。揃うまで下書きしません。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面の仕事、顧客、金額、時間、単価、請求番号、日付はすべて架空です。実在の取引はありません。QuickBooks、Xero、工数ツール、請求ツールとはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "書き出した仕事",
    "まずスキップルール",
    "並べた未請求キュー",
    "数字を照合する",
    "翌週のログ",
    "請求書は自分で作る",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "未請求作業確認のプレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で仕事や工数のCSVを確認するためのプロンプト、ワークシート、チェックリストです。AIはまずスキップルールを適用し、書き出しの項目だけで請求の下書きを作ります。結果（請求済み、保留、償却）は請求ログに残し、翌週のスキップに使います。請求前に確認します。請求書はあなたが作ります。送信も入金回収もしません。",
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
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。請求書はあなたが作ります。送信も入金回収もしません。",
  demo: {
    step1Lead:
      "この表は架空です。QuickBooks、Xero、工数ツール、請求ツールとはつながっていません。Atlas は接続も、アップロードも、送信もしません。",
    asOfLabel: "基準日（as_of・架空）",
    minAmountLabel: "請求の最小額（min_amount）",
    jobsHeading: "完了した仕事（架空）",
    jobsTableLabel: "完了した仕事",
    step2Lead:
      "並べ替えや請求の下書きより先に、スキップルールを適用します。外した行には、理由を必ず残します。",
    skippedJ91: "J-91（invoice_id INV-220 がある）。",
    skippedJ70: "J-70（status が warranty）。",
    skippedJ94: "J-94（金額 $85 が最小額 $150 未満）。",
    otherSkipRules:
      "この書き出しに該当行がなくても、係争中の仕事と、基準日より後の完了日もスキップ対象です。",
    step3Lead:
      "残った未請求の行を、完了日の古い順に並べます。この書き出しでは下書きする行は1件です。",
    queueHeading: "未請求キュー（基準日 2026-05-11・架空・請求候補1件、スキップ3件）",
    queueTableLabel: "並べた未請求キュー",
    confirmedJ88:
      "J-88 Northgate Clinic、完了 2026-04-22、$1,020（12 × $85）。invoice_id は空欄。status は completed。hours 12。rate 85。amount 1020。",
    outlineText: "Northgate Clinic、J-88、12時間 × $85、$1,020、日付 2026-04-22",
    doNotAddTax: DO_NOT_ADD_TAX,
    needsCheck:
      "この書き出しにはありません。顧客名や単価がない行はここに出し、下書きしません。",
    interpretation:
      "invoice_id が空欄でも、書き出しの外ですでに請求したことがない証明にはなりません。",
    recommended: `自分の請求ツールで、各行を請求する・保留する・償却するかを決めます。${YOU_CREATE}`,
    step4Lead:
      "J-88 の下書きを開きます。請求書を作る前に、確認済みの数字を書き出しの行と突き合わせます。",
    factButton: "書き出しの行と数字を照合する",
    factTableLabel: "J-88 の数字照合",
    factColumns: ["項目", "下書きの数字", "書き出しの行", "結果"],
    factResult: "一致",
    step5Lead:
      "結果を記録したあと、次の確認は新しい書き出しと、この請求ログから始めます。請求済みや償却の行は、ログのスキップルールで再度出しません。",
    billingLogHeading: "2026-05-11 の週の請求ログ（架空）",
    billingLogLabel: "請求ログ",
    nextWeekHeading: "基準日 2026-05-18 の模擬実行",
    skippedJ88NextWeek: "J-88（invoice_id INV-241 がある。ログで invoiced）。",
    loggedInvoiced: "ログに請求済みと書いた仕事は、もう一覧に出しません。",
    step6Title: YOU_CREATE,
    step6Body:
      "各行を自分の請求ツールで請求する・保留する・償却するか、何もしないと決めます。送信、編集、取消、入金済みへの変更は自動では行いません。",
    step6Boundary:
      "Atlas は QuickBooks、Xero、工数ツール、請求ツールには接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "未請求作業の準備",
      intro:
        "週1回の確認は、この順で進めます。本番の仕事一覧の前に、架空の仕事CSVで練習してください。結果の記録と、ログによるスキップも手順に含めます。請求前に確認します。",
    },
    {
      id: "queue-prompt",
      title: "未請求キューのプロンプト",
      intro:
        "ルール、仕事の書き出し、先週の請求ログと一緒に貼ります。まずスキップルールを適用し、残った行を古い完了日から並べ、確認済みとAIの解釈を分けて書きます。結果の書き方と、翌週のログスキップも指示します。請求前に確認します。",
    },
    {
      id: "next-week-prompt",
      title: "週次請求ログのプロンプト",
      intro:
        "翌週、新しい書き出しと今の請求ログと一緒に使います。invoice_id がある行、ログの結果が invoiced または write-off の行はスキップし、hold の行はキューに残します。",
    },
    {
      id: "rules-worksheet",
      title: "スキップルールと最小額",
      intro:
        "請求する最小額、請求しないステータス、常に外す仕事や顧客を書きます。できたルールはプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "billing-log-template",
      title: "請求ログのひな形",
      intro:
        "ガイドと同じ、架空の J-88（invoiced / INV-241）の行があります。使える結果は invoiced、hold、write-off、already_invoiced、warranty、below_minimum、disputed です。結果の値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "outline-review-checklist",
      title: "請求下書きの確認リスト",
      intro: "請求書を作る前に使います。進み具合はこのブラウザのセッションにだけ残ります。請求前に確認します。",
    },
    {
      id: "sample-job-export",
      title: "架空の仕事CSV",
      intro:
        "ガイドと同じ、架空の4行です。未請求キューのプロンプトと一緒に貼って、本番の前に練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "下書きの前にスキップルールを書きます。請求する最小額、請求しないステータス（初期値は warranty。オーナーが付けた write-off も）、常に外す仕事や顧客です。最小額、請求しないステータス、常に外す相手は人が決めます。",
    "完了した仕事や工数をCSVで書き出します。列は job または entry id、customer、完了日、hours、rate、amount、invoice status、invoice_id（あれば）、基準日（as_of）です。先週の請求ログも開きます。残す列は人が選びます。メール、電話番号、使わない列は消します。これは書き出しの確認です。QuickBooks、Xero、工数ツール、請求ツールとはつながりません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。ファイルを渡せないときや渡したくないときは、行を文字で貼るか、このデータにはAIを使いません。",
    "未請求キューのプロンプトと、スキップルールと最小額のルールを貼り、書き出しと請求ログを添付するか貼ります。",
    "AIはまずスキップルール（SKIP RULES FIRST）を適用します。invoice_id がある行、warranty や write-off、最小額未満、基準日より後の完了日、係争中の行を外し、理由を付けます。warranty、write-off、係争中でも請求するかは人が決めます。結果（invoiced、hold、write-off）は請求ログに書き、翌週はログのスキップルールで請求済みや償却の行を再度出しません。",
    "請求下書きの確認リストで、確認済みの数字を書き出しの行と突き合わせてから、自分の請求ツールで請求する・保留する・償却するかを決めます。請求前に確認します。キットは請求書を送らず、入金を記録せず、QuickBooks や Xero も変更しません。",
    "翌週、新しい書き出しと請求ログで確認するときは、Week-to-Week Billing Log Prompt（週次請求ログのプロンプト）を名前どおり貼り付けます。この2つ目のプロンプトは手順に残し、飛ばさないでください。",
  ],
  queuePrompt: `貼り付けた仕事または工数の書き出しと、私のスキップルールから、未請求作業の確認キューを作る手伝いをしてください。準備するのはあなたです。決めるのは私です。

まずスキップルール（SKIP RULES FIRST）。並べ替えや請求の下書きより先にスキップを適用してください。先に並べて、あとからスキップしてはいけません。

税、支払条件、明細項目を作らないでください。${DO_NOT_ADD_TAX}${NO_AUTOMATIC}${YOU_CREATE}

貼り付けるもの:
1. スキップルールと最小額のルール
2. 完了した仕事または工数の書き出し（job または entry id、customer、完了日、hours、rate、amount、invoice status、invoice_id、as_of）
3. 先週の請求ログ（あれば）

ルール
- 先頭に「まずスキップルール（SKIP RULES FIRST）」と書く。
- invoice_id がある行は外す。理由は invoice_id <id> present。
- 請求しないステータス（初期値 warranty。オーナーが付けた write-off も）の行は外す。理由は status <status>。
- 金額（または hours × 私の単価）が最小額未満の行は外す。理由は amount $<amount> is below your $<minimum> minimum。
- 完了日が基準日より後の行は外す。理由は completed after as-of date。
- 書き出しや請求ログで係争中の行は外す。理由は disputed; needs your decision。
- 常に外す一覧の仕事や顧客は外す。理由は on your always-skip list。
- 残った行で job id、customer、または hours と rate の両方と amount が欠けている場合は下書きしない。要確認に出す。
- amount がなく hours と rate があるときは hours × rate を計算し、その積を書き出しの項目からの確認済みとする。rate がなければ要確認。単価は作らない。
- 残った未請求の行を、完了日の古い順に並べる。同じ完了日なら金額の大きい順。
- 請求の下書きに書いてよいのは、書き出しの行にある customer、id、完了日、hours、rate、amount だけ。
- invoice_id が空欄なのは、空欄であることとして確認済み。書き出しの外ですでに請求したことがない証明にはしない。その注意は AIの解釈。
- 下書きは下書きだけ。送らない。請求書を作らない。入金を記録しない。請求ログの行案を出す。書くのは私。
- 結果（invoiced、hold、write-off）は請求ログに残す。翌週は新しい書き出しとログから始め、ログの結果が invoiced または write-off の行、または invoice_id がある行はスキップする。請求前に確認する。

出力:
まずスキップルール（SKIP RULES FIRST）
基準日時点の未請求キュー
残った行を古い順に、確認済みの項目と請求の下書き
スキップ: 外した行と理由
要確認: 足りない項目。顧客名や単価がない行はここに出し、下書きしない
AIの解釈: invoice_id が空欄でも、書き出しの外ですでに請求したことがない証明にはならない
推奨アクション（人が決める）: 自分の請求ツールで請求する・保留する・償却する。${YOU_CREATE}
結果の記録: 選んだ結果を請求ログに書く。翌週のログスキップに使う

作らない。税を付けない。送らない。${YOU_CREATE}`,
  queuePromptIntro:
    "ルール、仕事の書き出し、先週の請求ログと一緒に貼ります。まずスキップルールを適用し、残った行を古い完了日から並べ、確認済みとAIの解釈を分けて書きます。結果の書き方と、翌週のログスキップも指示します。請求前に確認します。",
  nextWeekPrompt: `新しい書き出しと請求ログを使って、翌週の未請求キューを作る手伝いをしてください。準備するのはあなたです。決めるのは私です。

${NO_AUTOMATIC}${YOU_CREATE}

貼り付けるもの:
1. スキップルールと最小額のルール
2. 新しい完了仕事または工数の書き出し（invoice_id があれば含む）
3. いまの請求ログ

新しい書き出しと、いまの請求ログから始めてください。
ログの結果が invoiced または write-off の行、または invoice_id が付いた行はスキップしてください。
hold の行は、ログからの確認済みメモを付けてキューに残してください。
スキップには理由を付けてください。
送らないでください。入金済みにもしないでください。

出力:
請求ログと新しい書き出しを使った、まずスキップルール（SKIP RULES FIRST）
スキップ: invoice_id がある行、またはログの結果が invoiced / write-off の行と理由
キュー: 残った未請求の行。hold はログからの確認済みメモ付き
推奨アクション（人が決める）: 自分の請求ツールで請求する・保留する・償却する。${YOU_CREATE}

送らない。${YOU_CREATE}`,
  nextWeekPromptIntro:
    "翌週、新しい書き出しと今の請求ログと一緒に使います。invoice_id がある行、ログの結果が invoiced または write-off の行はスキップし、hold の行はキューに残します。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  minimumAmountLabel: "請求する最小額（USD）",
  neverBilledLabel: "請求しないステータス（1行に1つ）",
  alwaysSkipLabel: "常に外す仕事または顧客（1行に1つ）",
  generateRules: "未請求のスキップルールを作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの未請求スキップルール",
  copyRules: "ルールをコピー",
  minimumAmountError: "0以上の最小金額を入力してください。",
  reviewRules: ({ minimumAmount, neverBilled, alwaysSkip }) => {
    const lines = [
      "invoice_id がある行はスキップする。",
      ...(neverBilled.length > 0 ? [`請求しないステータス: ${neverBilled.join("、")}。`] : []),
      `$${minimumAmount} 未満の金額はスキップする。`,
      "基準日より後の完了日はスキップする。",
      "係争中の仕事はスキップする。",
      ...alwaysSkip.map((name) => `常に対象外: ${name}`),
      "残った行は完了日の古い順に並べる。",
      "請求の下書きは、書き出しにある customer、id、日付、hours、rate、amount だけを使う。",
      "税、支払条件、明細項目は作らない。",
      "invoice_id が空欄でも、書き出しの外ですでに請求したことがない証明にはしない。",
      "結果（invoiced、hold、write-off）は請求ログに書く。翌週はログのスキップルールを使う。",
      "請求前に確認する。",
      YOU_CREATE,
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "並べ替えや請求の下書きより先に、スキップルール（SKIP RULES FIRST）を適用した。",
    "外した行には、見える理由がある。",
    "残った未請求の行は、完了日の古い順に並んでいる。",
    "確認済みの hours、rate、amount は、書き出しの行と一致している。",
    "確認済み、要確認、AIの解釈、推奨アクションは分けて書いてある。",
    "請求の下書きは、書き出しの customer、id、日付、hours、rate、amount だけを使っている。",
    "税や支払条件を作っていない。",
    "invoice_id が空欄でも、書き出しの外ですでに請求したことがない証明として扱っていない。",
    "自分の請求ツールで請求する・保留する・償却する。請求書はあなたが作ります。送信も入金回収もしません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の確認の前にリストをリセットしてください。請求する・保留する・償却するかは、自分の請求ツールで決めます。",
  sampleIntro:
    "ガイドと同じ、架空の4行です。未請求キューのプロンプトと一緒に貼って、本番の前に練習します。",
  billingLogIntro:
    "ガイドと同じ、架空の J-88（invoiced / INV-241）の行があります。使える結果は invoiced、hold、write-off、already_invoiced、warranty、below_minimum、disputed です。結果の値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "請求書を作る前に使います。進み具合はこのブラウザのセッションにだけ残ります。請求前に確認します。",
  fictionalBadge: "架空",
  allowedOutcomesLabel: "記録できる結果",
  allowedOutcomes: [
    "invoiced",
    "hold",
    "write-off",
    "already_invoiced",
    "warranty",
    "below_minimum",
    "disputed",
  ],
  safetyRules: [
    "仕事や請求の書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "メール、電話番号、使わない列は消します。",
    "口座番号、カード番号、納税者番号はAIに貼りません。",
    "税や支払条件は作りません。",
    "warranty や無償の手直しは、オーナーが決めるまで請求しません。",
    "invoice_id が空欄でも、書き出しの外ですでに請求したことがない証明にはしません。",
    "結果は請求ログに残し、翌週はログのスキップルールを使います。請求前に確認します。",
    `${NO_AUTOMATIC}${YOU_CREATE}`,
    "Atlas は QuickBooks、Xero、工数ツール、請求ツール、メール、その他のサービスには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

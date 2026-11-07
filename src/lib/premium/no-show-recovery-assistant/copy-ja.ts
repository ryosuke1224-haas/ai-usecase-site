import type { NoShowCopy } from "./copy-types";

const sampleBookingsCsv = [
  "time,client,service,status,contact_pref,sms_consent,prior_no_shows",
  "10:00,J. Rivera,カット＆カラー,no_show,sms,yes,0",
  "11:30,A. Chen,相談,attended,email,no,0",
  "13:00,M. Ortiz,カット,cancelled,email,no,1",
  "15:00,R. Kim,カラー,no_show,email,no,0",
  "16:30,L. Brooks,カット＆カラー,no_show,sms,yes,2",
  "",
  "service,when",
  "カット＆カラー,木曜 14:00",
  "カット＆カラー,金曜 09:30",
  "相談,木曜 11:00",
].join("\n");

const recoveryLogCsv = [
  "as_of,time,client,service,status,channel,sms_consent,prior_no_shows,slots_offered,action,outcome",
  "2026-10-14,10:00,J. Rivera,カット＆カラー,no_show,sms,yes,0,木曜 14:00; 金曜 09:30,drafted_not_sent,pending_human_approval",
  "2026-10-14,15:00,R. Kim,カラー,no_show,email,no,0,,not_drafted,sms_consent_no",
  "2026-10-14,16:30,L. Brooks,カット＆カラー,no_show,sms,yes,2,,not_drafted,flag_for_policy",
].join("\n");

const planDifferenceNotice =
  "ChatGPT、Claude、Gemini でファイルを添付できるか、データの扱いは、プラン、アカウント、管理者の設定によって違います。";

const sessionOnlyNotice =
  "ワークシートの入力とチェックリストの進捗は、このブラウザのセッションにだけ残り、Atlas には保存されません。";

export const japaneseNoShowCopy: NoShowCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "無断キャンセルの再予約",
  publicBody:
    "来なかった予約を確認し、実際の空き枠で再予約の文面を1通下書きします。SMSの下書きは sms_consent が yes で contact_pref が sms のときだけです。メールの同意は SMS の同意を意味しません。sms_consent が no または空欄のときは SMS を下書きしません。確認して送るのは人です。自動では送信しません。",
  labelsTitle: "この画面での情報の分け方",
  confirmedHelp: "予約行か、空き枠の一覧に書いてある内容です。",
  needsCheckHelp: "人が確認する不足です。sms_consent = no もここに入ります。",
  interpretationHelp: "AIが推測した内容です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面の予約、お客様、空き枠は架空です。実在のお客様ではなく、自動では送信しません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "その日の予約",
    "まず出席を確認する",
    "実在する空き枠で下書きする",
    "事実を照合する",
    "繰り返しの欠席は方針の判断",
    "人が確認して送る",
  ],
  demo: {
    asOfLabel: "基準日",
    asOfValue: "2026-10-14（架空）",
    step1Lead:
      "架空の1日分の予約と、その書き出しにあった空き枠です。カレンダーとはつながっていません。Atlas は SMS、メール、予約、キャンセルをしません。",
    bookingsLabel: "架空の予約書き出し",
    columns: ["time", "client", "service", "status", "contact_pref", "sms_consent", "prior_no_shows"],
    rows: [
      { time: "10:00", client: "J. Rivera", service: "カット＆カラー", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "0" },
      { time: "11:30", client: "A. Chen", service: "相談", status: "attended", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "13:00", client: "M. Ortiz", service: "カット", status: "cancelled", contactPref: "email", smsConsent: "no", prior: "1" },
      { time: "15:00", client: "R. Kim", service: "カラー", status: "no_show", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "16:30", client: "L. Brooks", service: "カット＆カラー", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "2" },
    ],
    openSlotsLabel: "書き出しにある空き枠",
    slots: [
      { service: "カット＆カラー", when: "木曜 14:00" },
      { service: "カット＆カラー", when: "金曜 09:30" },
      { service: "相談", when: "木曜 11:00" },
    ],
    consentTeaching:
      "メールの同意は SMS の同意を意味しません。A. Chen と R. Kim は contact_pref = email、sms_consent = no なので、SMS は下書きしません。",
    step2Lead:
      "まず出席を確認します。無断キャンセルは status = no_show の行だけです。attended と cancelled は、下書きの前に理由を付けて外します。",
    skippedLabel: "外した行",
    skipped: [
      { client: "A. Chen", reason: "attended。来店した人には連絡しません。" },
      { client: "M. Ortiz", reason: "cancelled。無断キャンセルではありません。" },
    ],
    confirmedLabel: "確認済みの無断キャンセル",
    confirmed: [
      { client: "J. Rivera", detail: "10:00 カット＆カラー。sms_consent = yes。contact_pref = sms。" },
      { client: "R. Kim", detail: "15:00 カラー。sms_consent = no。contact_pref = email。" },
      { client: "L. Brooks", detail: "16:30 カット＆カラー。prior_no_shows = 2。今日を含めると 3 です。" },
    ],
    smsHoldLabel: "要確認",
    smsHold:
      "R. Kim はメールの行があり、sms_consent = no です。メールの同意は SMS の同意を意味しません。SMS は下書きしません。",
    step3Lead:
      "Rebooking Draft Prompt（再予約の下書きプロンプト）は、出席を確認したあとだけ使います。案内できる時刻は、空き枠の一覧にあり、サービスが一致するものだけです。",
    promptName: "Rebooking Draft Prompt",
    draftLabel: "下書き（SMS、未送信）",
    draftText: "J. さん、本日はお待ちしておりました。木曜 14:00 か金曜 09:30 のカット＆カラーはいかがでしょうか。",
    step3Needs:
      "R. Kim は要確認のままです。sms_consent = no なので SMS の下書きはありません。メールの同意は SMS の同意を意味しません。",
    step3Policy: "L. Brooks はここでは下書きしません。繰り返しの基準に達したので、方針の判断を待ちます。",
    step3Boundary: "自動では送信しません。人が確認して送ります。",
    step4Lead: "J. Rivera の行を開きます。連絡する前に、確認済みの項目を予約行と照合します。",
    factButton: "予約行と事実を照合する",
    factTableLabel: "J. Rivera の事実照合",
    factColumns: ["項目", "確認済みの行", "予約行", "結果"],
    factRows: [
      { field: "status", confirmed: "no_show", booking: "no_show" },
      { field: "sms_consent", confirmed: "yes", booking: "yes" },
      { field: "contact_pref", confirmed: "sms", booking: "sms" },
      { field: "service", confirmed: "カット＆カラー", booking: "カット＆カラー" },
    ],
    factResult: "一致",
    step5Lead:
      "L. Brooks の prior_no_shows は 2 です。今日の欠席を含めると、繰り返しの基準 3 に達します。",
    policyLabel: "方針確認",
    policyDetail:
      "人が決めるまで再予約の下書きは作りません。繰り返しの欠席へ自動では連絡しません。自動では送信しません。",
    step5Boundary: "例外にするか、預かり金にするか、連絡しないかは人が決めます。キットは送信しません。",
    step6TitleSentence: "人が確認して送ります。自動では送信しません。",
    step6Body:
      "宛先は自分の連絡先から選び、自分の SMS かメールの道具から送るか、送らないと決めます。このテンプレートは送信、予約、キャンセル、請求をしません。",
    step6Boundary: "送信の前に、人がすべての文面を承認します。キットは何も変更しません。",
    kitLink: "Premiumキットを開く（ログインが必要、プライベートプレビュー）",
  },
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "無断キャンセルの再予約 プレミアムキット",
  kitBody:
    "1日分の予約書き出しを ChatGPT、Claude、Gemini で確認するためのプロンプト、ワークシート、チェックリストです。出席、同意、一致する空き枠を確認してから下書きします。確認して送るのは人です。自動では送信しません。キットは何も変更しません。",
  planDifferenceNotice,
  sessionOnlyNotice,
  kitNavLabel: "キットの内容",
  inThisKit: "このキットの内容",
  backToDemo: "ガイドに戻る",
  lockedEyebrow: "Premium · プライベートプレビュー",
  lockedTitle: "Premiumはロックされています",
  lockedBody:
    "ログインしています。このPremiumキットはプライベートプレビューです。現在、購入手続きはありません。このプライベートプレビューでは、利用権が記録されたアカウントだけが開けます。このアカウントには利用権がないため、キットは閉じたままです。確認して送るのは人です。自動では送信しません。キットは何も変更しません。",
  sections: [
    {
      id: "setup-checklist",
      title: "準備チェックリスト",
      intro:
        "実際の書き出しを貼る前に、この順で準備します。2つ目のプロンプトの名前は Rebooking Draft Prompt（再予約の下書きプロンプト）です。出席を確認したあとだけ貼ります。先に架空の見本で試してください。",
    },
    {
      id: "attendance-prompt",
      title: "出席確認プロンプト",
      intro:
        "ルール、予約行、空き枠と一緒に貼ります。再予約の下書きより先に出席を確認します。sms_consent が no または空欄のときは SMS を下書きしません。メールの同意は SMS の同意を意味しません。",
    },
    {
      id: "rebooking-draft-prompt",
      title: "再予約の下書きプロンプト",
      intro:
        "これが Rebooking Draft Prompt です。出席確認プロンプトのあと、欠席を人が確認してから使います。実在する空き枠で文面を1通下書きします。自動では送信しません。",
    },
    {
      id: "rules-worksheet",
      title: "同意と繰り返しの方針",
      intro:
        "繰り返しの基準、無断キャンセルにしないステータス、連絡しない人を決めます。ここに入れた内容は Atlas に保存されません。",
    },
    {
      id: "recovery-log-template",
      title: "対応記録のひな形",
      intro:
        "この列で自分の表を始めます。送ったか、送らなかったかを記録するのは人だけです。CSVのコピーには、送っていない架空の J. Rivera の行が含まれます。自動では送信しません。",
    },
    {
      id: "action-review-checklist",
      title: "送信前の確認リスト",
      intro:
        "連絡する前に使います。進捗はこのブラウザのセッションにだけ残ります。すべての文面は人が承認します。自動では送信しません。",
    },
    {
      id: "sample-bookings",
      title: "架空の予約見本",
      intro:
        "ガイドと同じ、2026-10-14 の架空の1日です。R. Kim はメールの行があり、sms_consent = no です。メールの同意は SMS の同意を意味しません。実名の前に、この見本でプロンプトを試してください。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "予約の書き出しを貼る前に読んでください。確認して送るのは人です。自動では送信しません。",
    },
  ],
  setupSteps: [
    "下書きの前にルールを書きます。無断キャンセルにしないステータス（初期値は cancelled。attended は必ず外す）、今日を含む繰り返しの基準、この手順から連絡しない人です。方針の案件にするか、連絡しない人は、人が決めます。",
    "1日分の予約を CSV で書き出します。列は time、client、service、status、contact_pref、sms_consent、prior_no_shows と、そのサービスに合う空き枠です。残す列は人が選びます。電話番号、メールアドレス、カード番号、この手順で使わない列は消します。これは書き出しの確認であり、Calendly、Square、Acuity、Google カレンダー、Twilio とはつながりません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールのデータ設定を確認します。ChatGPT、Claude、Gemini でファイルを添付できるか、データの扱いは、プラン、アカウント、管理者の設定によって違います。ファイルを受け取れないとき、またはアップロードしたくないときは、行を文章で貼るか、このデータには AI を使わないでください。",
    "出席確認プロンプトと、同意と繰り返しの方針で作ったルールを貼り、予約行と空き枠を添付または貼り付けます。",
    "AI は先に出席を確認します。下書きするのは予約行の status = no_show だけです。attended と cancelled は理由を見せて外します。no_show と書いてあっても無断キャンセルかは、人が決めます。sms_consent が no または空欄のときは SMS を下書きしません。メールの同意は SMS の同意を意味しません。",
    "出席を確認したあと、Rebooking Draft Prompt（再予約の下書きプロンプト）を名前どおり貼り付け、実在する空き枠で再予約の文面を1通下書きします。この2つ目のプロンプトを準備に残し、あとから飛ばさないようにします。",
    "送信前の確認リストを使い、連絡する前に確認済みの項目を予約行と照合します。宛先は自分の連絡先から選び、自分の SMS かメールから送るか、送らないと決めます。自動では送信しません。このテンプレートは送信、予約、キャンセル、請求をしません。",
  ],
  attendancePrompt: `1日分の予約書き出しから、再予約の下書きの前に出席を確認するのを手伝ってください。準備はあなた、決定は私です。

まず出席を確認します。下書きしてよいのは、予約行の status = no_show だけです。先に下書きして、あとから確認してはいけません。

電話番号、メールアドレス、預かり金、空き時刻、到着時刻を作らないでください。送信しない。予約しない。キャンセルしない。請求しない。連絡の前に同意を確認する。自動では送信しません。

貼り付けるものは次です。
1. 同意と繰り返しの方針で作ったルール。
2. 1日分の予約行（time, client, service, status, contact_pref, sms_consent, prior_no_shows）。
3. サービス、曜日または日付、時刻が書いてある空き枠。

ルール
- 最初に「まず出席を確認する」と書く。
- 予約行の status が no_show のときだけ下書きする。対応する行を見せる。
- status が attended の行は外す。理由は attended。来店した人には連絡しない。
- 無断キャンセルにしないステータス（初期値は cancelled）の行は外す。理由は cancelled。無断キャンセルではない。
- sms_consent が no または空欄のときは SMS を下書きしない。メールの同意は SMS の同意を意味しません。要確認と書く。
- time、client、service、status が欠けている行、または同じ人が同じ時刻に2回出る行は下書きしない。要確認に入れる。
- 確認済み（書き出しにある事実）、AIの解釈、推奨アクションを分けて書く。
- 到着時刻がないことは、遅れていたかどうかの証明ではない。その推測は AIの解釈であり、確認済みの事実ではない。

出力
まず出席を確認する
確認済み: 確認できた無断キャンセルごとに、行にある time, client, service, status, contact_pref, sms_consent, prior_no_shows。
外す: attended と cancelled の行と理由。
SMSは下書きしない: sms_consent が no または空欄。要確認。SMS は下書きしない。メールの同意は SMS の同意を意味しません。連絡の前に同意を確認する。
方針確認: 繰り返しの基準に達した欠席。人が決めるまで再予約の下書きはしない。
AIの解釈: 到着時刻がないときの遅刻などの推測。事実として書かない。
推奨アクション（人が決める）: 人が確認すること。送信しない。自動では送信しません。

作らない。送信しない。連絡の前に同意を確認する。人が確認して送る。キットは何も変更しない。`,
  rebookingDraftPrompt: `出席を確認したあとだけ、再予約の文面を下書きするのを手伝ってください。準備はあなた、決定は私です。

このプロンプトは Rebooking Draft Prompt です。出席確認が終わり、人が欠席を確認したあとだけ使ってください。

電話番号、メールアドレス、預かり金、空き時刻を作らないでください。送信しない。予約しない。キャンセルしない。請求しない。人が確認して送る。自動では送信しません。キットは何も変更しません。

貼り付けるものは次です。
1. 同意と繰り返しの方針で作ったルール。
2. 出席確認プロンプトで確認済みになった無断キャンセルの行。
3. 書き出しの空き枠。

ルール
- SMS の下書きは sms_consent = yes かつ contact_pref = sms のときだけ。sms_consent が no または空欄のときは、SMS の同意がないとして要確認と書き、SMS を下書きしない。
- メールの同意は SMS の同意を意味しません。contact_pref = email や、メールアドレスがファイルにあることは SMS の同意ではありません。
- 案内できるのは、欠席したサービスと一致する空き枠だけです。時刻は、空き枠の一覧にあり、その枠のサービスが一致するときだけ使えます。
- 一致する空き枠がなければ、一致する空き枠がないとして要確認と書く。時刻を作らない。
- prior_no_shows に今日の欠席を足して繰り返しの基準に達したら、方針確認と書き、人が決めるまで再予約の文面を下書きしない。
- 空き枠は書き出し時点のものです。送るときも空いているとは約束しない。
- 下書きは下書きです。送信しない。

出力
下書き（SMS、未送信）は、sms_consent = yes、contact_pref = sms、一致する空き枠がある確認済みの無断キャンセルだけ。
方針確認: 基準に達した繰り返しの欠席には下書きしない。
要確認: sms_consent = no、sms_consent が空欄、または一致する空き枠がない。メールの同意は SMS の同意を意味しません。
推奨アクション（人が決める）: 下書きを確認する。送信しない。人が確認して送る。自動では送信しません。

作らない。送信しない。人が確認して送る。キットは何も変更しない。`,
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動でコピーできませんでした。上の文を選択してコピーしてください。",
  consentHelper:
    "メールの同意は SMS の同意を意味しません。sms_consent が no または空欄のときは、SMS を下書きしない、とルールに書きます。",
  thresholdLabel: "今日を含む、繰り返し欠席の基準",
  neverStatusesLabel: "無断キャンセルにしないステータス（1行に1つ）",
  alwaysSkipLabel: "常に対象外にするお客様（1行に1つ）",
  generateRules: "再予約ルールを作る",
  inputsChanged: "入力が変わりました。コピーする前に、もう一度作ってください。",
  rulesHeading: "あなたの再予約ルール",
  copyRules: "ルールをコピー",
  thresholdError: "繰り返しの基準は1以上の数を入力してください。",
  recoveryRules: ({ threshold, neverStatuses, skipClients }) => {
    const lines = [
      "下書きの前に、予約行の status = no_show を確認する。",
      "attended には下書きしない。",
      ...(neverStatuses.length > 0 ? [`${neverStatuses.join("; ")} は無断キャンセルとして扱わない。`] : []),
      ...skipClients.map((name) => `常に対象外: ${name}`),
      "SMSの下書きは sms_consent = yes かつ contact_pref = sms のときだけ。",
      "sms_consent が no または空欄のときは SMS を下書きしない。",
      "メールの同意は SMS の同意を意味しません。",
      "送信前に同意を確認する。",
      `この欠席が繰り返しの基準 ${threshold} に達したら方針確認にする。`,
      "案内する枠は、欠席したサービスと一致する空きだけ。",
      "自動では送信しません。",
      "送信しない。人が確認して送る。キットは何も変更しない。",
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "下書きの前に、出席確認が終わっている。",
    "attended の行は、理由を見せて外した。",
    "cancelled の行は外し、無断キャンセルとして扱っていない。",
    "確認済みの項目は、予約行と一致している。",
    "確認済み、AIの解釈、推奨アクションが分かれている。",
    "SMSの下書きは sms_consent が yes かつ contact_pref が sms のときだけ。sms_consent が no または空欄のときは SMS を下書きしない。メールの同意は SMS の同意を意味しません。",
    "案内した時刻は空き枠の一覧にあり、欠席したサービスと一致している。",
    "基準に達した繰り返しの欠席は、自動で下書きせず方針確認にした。",
    "宛先は自分の連絡先から選び、自分の SMS かメールから自分が送る。自動では送信しません。キットは何も変更しない。",
  ],
  checkedLabel: (done, total) => `${total}件中 ${done}件を確認`,
  resetChecklist: "チェックをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の前にチェックをリセットしてください。送るかどうかは、まだ人が決めます。自動では送信しません。",
  allowedOutcomesLabel: "記録できる結果",
  allowedOutcomes: ["drafted_not_sent", "sent_by_person", "not_drafted", "skipped"],
  fictionalExample: "架空の見本行",
  fictionalBadge: "架空",
  copyCsv: "CSVをコピー",
  sampleTableLabel: "架空の予約見本",
  logTableLabel: "架空の見本行がある対応記録",
  logColumns: [
    "as_of",
    "time",
    "client",
    "service",
    "status",
    "channel",
    "sms_consent",
    "prior_no_shows",
    "slots_offered",
    "action",
    "outcome",
  ],
  safetyRules: [
    "予約の書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールのデータ設定を確認してください。ChatGPT、Claude、Gemini でファイルを添付できるか、データの扱いは、プラン、アカウント、管理者の設定によって違います。",
    "電話番号、メールアドレス、カード番号、この手順で使わない列は消します。",
    "電話番号、メールアドレス、パスワード、カード番号を AI に貼らないでください。",
    "来店した人（attended）には連絡しません。",
    "同意のない SMS は送りません。sms_consent = no も、sms_consent が空欄も、SMS を下書きしません。",
    "メールの同意は SMS の同意を意味しません。",
    "空いていない枠、サービスが違う枠は案内しません。",
    "繰り返しの欠席へ自動では連絡しません。",
    "自動では送信しません。予約、キャンセル、請求も自動では行いません。人が確認して送ります。送信の前に、人がすべての文面を承認します。キットは何も変更しません。",
    "Atlas は Calendly、Square、Acuity、Google カレンダー、Twilio、SMS、メール、その他のサービスとはつながりません。OAuth も API 呼び出しもなく、データを第三者へ送りません。",
    sessionOnlyNotice,
  ],
  sampleBookingsCsv,
  recoveryLogCsv,
};

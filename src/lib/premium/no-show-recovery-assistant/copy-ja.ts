import type { NoShowCopy } from "./copy-types";

const sampleBookingsCsv = [
  "time,client,service,status,contact_pref,sms_consent,prior_no_shows",
  "10:00,佐藤,カット＆カラー,no_show,sms,yes,0",
  "11:30,高橋,相談,attended,email,no,0",
  "13:00,鈴木,カット,cancelled,email,no,1",
  "15:00,中村,カラー,no_show,email,no,0",
  "16:30,小林,カット＆カラー,no_show,sms,yes,2",
  "",
  "service,when",
  "カット＆カラー,木曜 14:00",
  "カット＆カラー,金曜 09:30",
  "相談,木曜 11:00",
].join("\n");

const recoveryLogCsv = [
  "as_of,time,client,service,status,channel,sms_consent,prior_no_shows,slots_offered,action,outcome",
  "2026-10-14,10:00,佐藤,カット＆カラー,no_show,sms,yes,0,木曜 14:00; 金曜 09:30,drafted_not_sent,pending_human_approval",
  "2026-10-14,15:00,中村,カラー,no_show,email,no,0,,not_drafted,sms_consent_no",
  "2026-10-14,16:30,小林,カット＆カラー,no_show,sms,yes,2,,not_drafted,flag_for_policy",
].join("\n");

const planDifferenceNotice =
  "ChatGPT、Claude、Geminiでファイルを付けられるか、データをどう扱うかは、プランとアカウントの設定で違います。";

const sessionOnlyNotice =
  "入力とチェックの進み具合は、このブラウザだけに残り、Atlasには保存されません。";

export const japaneseNoShowCopy: NoShowCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "無断キャンセルの再予約",
  publicBody:
    "来なかった予約を確認し、空いている枠で再予約の文面を1通下書きします。SMSは sms_consent が yes、contact_pref が sms のときだけ下書きします。メールの同意は SMS の同意を意味しません。sms_consent が no または空欄なら、SMSは下書きしません。送るかどうかは人が決めます。自動では送信しません。",
  labelsTitle: "ラベルの意味",
  confirmedHelp: "予約データか、空き枠の一覧に書いてある事実です。",
  needsCheckHelp: "人が確認する不足です。sms_consent = no も含まれます。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面の予約、お客様、空き枠は架空です。実在のお客様はいません。自動では送信しません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "その日の予約",
    "先に来店を確認する",
    "空いている枠で下書きする",
    "予約データと照合する",
    "繰り返しは人が判断する",
    "人が確認して送る",
  ],
  demo: {
    asOfLabel: "見本の日付",
    asOfValue: "2026-10-14（架空）",
    step1Lead:
      "架空の1日分です。空き枠も、この見本に書いてあるものだけです。カレンダーとはつながっていません。AtlasはSMS、メール、予約、キャンセルをしません。",
    bookingsLabel: "架空の予約データ",
    columns: ["time", "client", "service", "status", "contact_pref", "sms_consent", "prior_no_shows"],
    rows: [
      { time: "10:00", client: "佐藤", service: "カット＆カラー", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "0" },
      { time: "11:30", client: "高橋", service: "相談", status: "attended", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "13:00", client: "鈴木", service: "カット", status: "cancelled", contactPref: "email", smsConsent: "no", prior: "1" },
      { time: "15:00", client: "中村", service: "カラー", status: "no_show", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "16:30", client: "小林", service: "カット＆カラー", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "2" },
    ],
    openSlotsLabel: "見本にある空き枠",
    slots: [
      { service: "カット＆カラー", when: "木曜 14:00" },
      { service: "カット＆カラー", when: "金曜 09:30" },
      { service: "相談", when: "木曜 11:00" },
    ],
    consentTeaching:
      "メールの同意は SMS の同意を意味しません。高橋さんと中村さんは contact_pref = email、sms_consent = no なので、SMSは下書きしません。",
    step2Lead:
      "先に来店したかを確認します。無断キャンセルは status = no_show の行だけです。attended と cancelled は、理由を付けて下書きから外します。",
    skippedLabel: "外した行",
    skipped: [
      { client: "高橋", reason: "status は attended です。来店した人には連絡しません。" },
      { client: "鈴木", reason: "status は cancelled です。無断キャンセルではありません。" },
    ],
    confirmedLabel: "確認済みの無断キャンセル",
    confirmed: [
      { client: "佐藤", detail: "10:00 カット＆カラー。sms_consent = yes。contact_pref = sms。" },
      { client: "中村", detail: "15:00 カラー。sms_consent = no。contact_pref = email。" },
      { client: "小林", detail: "16:30 カット＆カラー。prior_no_shows = 2。今日を含めると 3 です。" },
    ],
    smsHoldLabel: "要確認",
    smsHold:
      "中村さんの連絡方法はメールで、sms_consent = no です。メールの同意は SMS の同意を意味しません。SMSは下書きしません。",
    step3Lead:
      "Rebooking Draft Prompt（再予約の下書き）は、来店を確認したあとだけ使います。案内できる時刻は、空き枠の一覧にあり、メニューが一致するものだけです。",
    promptName: "Rebooking Draft Prompt",
    draftLabel: "下書き（SMS、未送信）",
    draftText: "佐藤さん、本日はお待ちしておりました。木曜 14:00 か金曜 09:30 のカット＆カラーはいかがでしょうか。",
    step3Needs:
      "中村さんは要確認のままです。sms_consent = no なので、SMSの下書きはありません。メールの同意は SMS の同意を意味しません。",
    step3Policy: "小林さんはここでは下書きしません。繰り返しの基準に達したので、人の判断を待ちます。",
    step3Boundary: "自動では送信しません。人が確認して送ります。",
    step4Lead: "佐藤さんの行を開きます。連絡する前に、確認済みの項目を予約データと照合します。",
    factButton: "予約データと照合する",
    factTableLabel: "佐藤さんの照合",
    factColumns: ["項目", "確認済み", "予約データ", "結果"],
    factRows: [
      { field: "status", confirmed: "no_show", booking: "no_show" },
      { field: "sms_consent", confirmed: "yes", booking: "yes" },
      { field: "contact_pref", confirmed: "sms", booking: "sms" },
      { field: "service", confirmed: "カット＆カラー", booking: "カット＆カラー" },
    ],
    factResult: "一致",
    step5Lead: "小林さんの prior_no_shows は 2 です。今日を含めると、繰り返しの基準 3 に達します。",
    policyLabel: "方針確認",
    policyDetail:
      "人が決めるまで、再予約の下書きは作りません。繰り返しの無断キャンセルへは自動で連絡しません。自動では送信しません。",
    step5Boundary: "例外にするか、予約金にするか、連絡しないかは人が決めます。キットは送信しません。",
    step6TitleSentence: "人が確認して送ります。自動では送信しません。",
    step6Body:
      "宛先は自分の連絡先から選び、自分のSMSかメールから送るか、送らないと決めます。このテンプレートは送信、予約、キャンセル、請求をしません。",
    step6Boundary: "送る前に、人がすべての文面を承認します。キットは何も変更しません。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  kitEyebrow: "プレミアム · プライベートプレビュー",
  kitTitle: "無断キャンセル再予約のプレミアムキット",
  kitBody:
    "1日分の予約データを、ChatGPT、Claude、Geminiで確認するためのプロンプトとチェックリストです。来店、同意、空き枠が揃ってから下書きします。送るのは人です。自動では送信しません。",
  planDifferenceNotice,
  sessionOnlyNotice,
  kitNavLabel: "キットの内容",
  inThisKit: "このキットの内容",
  backToDemo: "ガイドに戻る",
  lockedEyebrow: "プレミアム · プライベートプレビュー",
  lockedTitle: "Premiumはロックされています",
  lockedBody:
    "ログイン済みです。このPremiumキットはプライベートプレビューです。現在、購入手続きはありません。開けるのは、利用を許可したアカウントだけです。このアカウントはまだ許可されていないため、キットは閉じたままです。送るのは人です。自動では送信しません。キットは何も変更しません。",
  sections: [
    {
      id: "setup-checklist",
      title: "準備チェックリスト",
      intro:
        "実データを貼る前に、この順で準備します。2つ目のプロンプトの名前は Rebooking Draft Prompt（再予約の下書き）です。来店を確認したあとだけ使います。先に架空の見本で試してください。",
    },
    {
      id: "attendance-prompt",
      title: "来店確認プロンプト",
      intro:
        "ルール、予約データ、空き枠と一緒に貼ります。再予約の下書きより先に、来店を確認します。sms_consent が no または空欄のときは、SMSを下書きしません。メールの同意は SMS の同意を意味しません。",
    },
    {
      id: "rebooking-draft-prompt",
      title: "再予約の下書きプロンプト",
      intro:
        "これが Rebooking Draft Prompt です。来店確認のあと、無断キャンセルを人が確認してから使います。空いている枠で文面を1通下書きします。自動では送信しません。",
    },
    {
      id: "rules-worksheet",
      title: "同意と繰り返しのルール",
      intro: "繰り返しの基準、無断キャンセルにしないステータス、連絡しない人を決めます。ここに入れた内容は Atlas に保存されません。",
    },
    {
      id: "recovery-log-template",
      title: "対応記録のひな形",
      intro:
        "この列で自分の表を始めます。送ったか送らなかったかを書くのは人だけです。結果の値は drafted_not_sent のように、英語のまま記録します。CSVの見本には、送っていない佐藤さんの行があります。自動では送信しません。",
    },
    {
      id: "action-review-checklist",
      title: "送信前の確認リスト",
      intro: "連絡する前に使います。進み具合はこのブラウザだけに残ります。文面はすべて人が承認します。自動では送信しません。",
    },
    {
      id: "sample-bookings",
      title: "架空の予約見本",
      intro:
        "ガイドと同じ、2026-10-14 の架空の1日です。中村さんはメール連絡で、sms_consent = no です。メールの同意は SMS の同意を意味しません。実名の前に、この見本で試してください。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "予約データを貼る前に読んでください。送るのは人です。自動では送信しません。",
    },
  ],
  setupSteps: [
    "下書きの前にルールを書きます。無断キャンセルにしないステータス（初期値は cancelled。attended は必ず外す）、今日を含む繰り返しの基準、連絡しない人です。繰り返しとして止めるか、連絡しない人にするかは、人が決めます。",
    "1日分の予約をCSVで書き出します。列は time、client、service、status、contact_pref、sms_consent、prior_no_shows と、そのメニューの空き枠です。残す列は人が選びます。電話番号、メールアドレス、カード番号、使わない列は消します。これは書き出しの確認です。Calendly、Square、Acuity、Googleカレンダー、Twilioとはつながりません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールのデータ設定を確認します。ChatGPT、Claude、Geminiでファイルを付けられるか、データをどう扱うかは、プランとアカウントの設定で違います。ファイルを渡せないときや、渡したくないときは、必要な行だけ文章で貼るか、AIを使わず自分で確認してください。",
    "来店確認プロンプトと、同意と繰り返しのルールを貼り、予約データと空き枠を添付または貼り付けます。",
    "AIは先に来店を確認します。下書きするのは status = no_show の行だけです。attended と cancelled は理由を見せて外します。no_show と書いてあっても無断キャンセルかは、人が決めます。sms_consent が no または空欄のときは、SMSを下書きしません。メールの同意は SMS の同意を意味しません。",
    "来店を確認したあと、Rebooking Draft Prompt（再予約の下書き）を名前どおり貼り付け、空いている枠で再予約の文面を1通下書きします。この2つ目のプロンプトは手順に残し、飛ばさないでください。",
    "送信前の確認リストで、確認済みの項目を予約データと照合します。宛先は自分の連絡先から選び、自分のSMSかメールから送るか、送らないと決めます。自動では送信しません。このテンプレートは送信、予約、キャンセル、請求をしません。",
  ],
  attendancePrompt: `1日分の予約データから、再予約の下書きの前に来店状況を確認してください。下書きはあなた、送る判断は私です。

先に来店を確認します。下書きしてよいのは、予約データの status = no_show だけです。先に下書きして、あとから確認してはいけません。

電話番号、メールアドレス、予約金、空き時刻、到着時刻を作らないでください。送信、予約、キャンセル、請求はしないでください。連絡の前に同意を確認してください。自動では送信しません。

貼り付けるものは次です。
1. 同意と繰り返しのルール。
2. 1日分の予約データ（time, client, service, status, contact_pref, sms_consent, prior_no_shows）。
3. メニュー、曜日または日付、時刻が書いてある空き枠。

ルール
- 最初に「先に来店を確認する」と書く。
- 予約データの status が no_show のときだけ下書きする。対応する行を見せる。
- status が attended の行は外す。理由は来店済み。来店した人には連絡しない。
- 無断キャンセルにしないステータス（初期値は cancelled）の行は外す。理由は cancelled。無断キャンセルではない。
- sms_consent が no または空欄のときは SMS を下書きしない。メールの同意は SMS の同意を意味しません。要確認と書く。
- time、client、service、status が欠けている行、または同じ人が同じ時刻に2回出る行は下書きしない。要確認に入れる。
- 確認済み（データにある事実）、AIの解釈、推奨アクションを分けて書く。
- 到着時刻がないことは、遅れていた証拠にはなりません。その推測は AIの解釈であり、確認済みの事実ではありません。

出力
先に来店を確認する
確認済み: 確認できた無断キャンセルごとに、行にある time, client, service, status, contact_pref, sms_consent, prior_no_shows。
外す: attended と cancelled の行と理由。
SMSは下書きしない: sms_consent が no または空欄。要確認。SMS は下書きしない。メールの同意は SMS の同意を意味しません。連絡の前に同意を確認する。
方針確認: 繰り返しの基準に達した無断キャンセル。人が決めるまで再予約の下書きはしない。
AIの解釈: 到着時刻がないときの遅刻などの推測。事実として書かない。
推奨アクション（人が決める）: 人が確認すること。送信しない。自動では送信しません。

電話番号や時刻は作らない。送信しない。連絡の前に同意を確認する。人が確認して送る。キットは何も変更しない。`,
  rebookingDraftPrompt: `来店を確認したあとだけ、再予約の文面を1通下書きしてください。下書きはあなた、送る判断は私です。

このプロンプトは Rebooking Draft Prompt です。来店確認が終わり、無断キャンセルを人が確認したあとだけ使ってください。

電話番号、メールアドレス、予約金、空き時刻を作らないでください。送信、予約、キャンセル、請求はしないでください。人が確認して送ります。自動では送信しません。キットは何も変更しません。

貼り付けるものは次です。
1. 同意と繰り返しのルール。
2. 来店確認プロンプトで確認済みになった無断キャンセルの行。
3. 見本または書き出しにある空き枠。

ルール
- SMS の下書きは sms_consent = yes かつ contact_pref = sms のときだけ。sms_consent が no または空欄のときは、SMS の同意がないとして要確認と書き、SMS を下書きしない。
- メールの同意は SMS の同意を意味しません。contact_pref = email や、メールアドレスがファイルにあることは SMS の同意ではありません。
- 案内できるのは、来なかったメニューと一致する空き枠だけです。時刻は、空き枠の一覧にあり、その枠のメニューが一致するときだけ使えます。
- 一致する空き枠がなければ、一致する空き枠がないとして要確認と書く。時刻を作らない。
- prior_no_shows に今日の無断キャンセルを足して繰り返しの基準に達したら、方針確認と書き、人が決めるまで再予約の文面を下書きしない。
- 空き枠は書き出し時点のものです。送るときも空いているとは約束しない。
- 下書きは下書きです。送信しない。

出力
下書き（SMS、未送信）は、sms_consent = yes、contact_pref = sms、一致する空き枠がある確認済みの無断キャンセルだけ。
方針確認: 基準に達した繰り返しの無断キャンセルには下書きしない。
要確認: sms_consent = no、sms_consent が空欄、または一致する空き枠がない。メールの同意は SMS の同意を意味しません。
推奨アクション（人が決める）: 下書きを確認する。送信しない。人が確認して送る。自動では送信しません。

電話番号や時刻は作らない。送信しない。人が確認して送る。キットは何も変更しない。`,
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動でコピーできませんでした。上の文を選択してコピーしてください。",
  consentHelper:
    "メールの同意は SMS の同意を意味しません。sms_consent が no または空欄のときは、SMSを下書きしない、とルールに書きます。",
  thresholdLabel: "今日を含む繰り返しの基準",
  neverStatusesLabel: "無断キャンセルにしないステータス（1行に1つ）",
  alwaysSkipLabel: "常に連絡しないお客様（1行に1つ）",
  generateRules: "再予約ルールを作る",
  inputsChanged: "入力が変わりました。コピーする前に、もう一度作ってください。",
  rulesHeading: "あなたの再予約ルール",
  copyRules: "ルールをコピー",
  thresholdError: "繰り返しの基準は1以上の数を入力してください。",
  recoveryRules: ({ threshold, neverStatuses, skipClients }) => {
    const lines = [
      "下書きの前に、予約データの status = no_show を確認する。",
      "attended の行は下書きしない。",
      ...(neverStatuses.length > 0 ? [`${neverStatuses.join("、")} は無断キャンセルとして扱わない。`] : []),
      ...skipClients.map((name) => `常に対象外: ${name}`),
      "SMSの下書きは sms_consent = yes かつ contact_pref = sms のときだけ。",
      "sms_consent が no または空欄のときは SMS を下書きしない。",
      "メールの同意は SMS の同意を意味しません。",
      "送る前に同意を確認する。",
      `今日を含めた無断キャンセルが基準 ${threshold} に達したら、方針確認にする。`,
      "案内できるのは、来なかったメニューと一致する空き枠だけ。",
      "自動では送信しません。",
      "送信はしない。人が確認して送る。キットは何も変更しない。",
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "下書きの前に、来店確認が終わっている。",
    "attended の行は、理由を見せて外した。",
    "cancelled の行は外し、無断キャンセルとして扱っていない。",
    "確認済みの項目は、予約データと一致している。",
    "確認済み、AIの解釈、推奨アクションが分かれている。",
    "SMSの下書きは sms_consent が yes かつ contact_pref が sms のときだけ。sms_consent が no または空欄のときは SMS を下書きしない。メールの同意は SMS の同意を意味しません。",
    "案内した時刻は空き枠の一覧にあり、来なかったメニューと一致している。",
    "基準に達した繰り返しは、自動で下書きせず方針確認にした。",
    "宛先は自分の連絡先から選び、自分のSMSかメールから自分が送る。自動では送信しません。キットは何も変更しない。",
  ],
  checkedLabel: (done, total) => `チェック ${done} / ${total}`,
  resetChecklist: "チェックを外す",
  reviewComplete:
    "この回の確認は終わりです。次の前にチェックを外してください。送るかは、まだ人が決めます。自動では送信しません。",
  allowedOutcomesLabel: "記録できる結果",
  allowedOutcomes: ["drafted_not_sent", "sent_by_person", "not_drafted", "skipped"],
  fictionalExample: "架空の見本行",
  fictionalBadge: "架空",
  copyCsv: "CSVをコピー",
  sampleTableLabel: "架空の予約見本",
  logTableLabel: "架空の見本がある対応記録",
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
    "予約データを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールのデータ設定を確認してください。ChatGPT、Claude、Geminiでファイルを付けられるか、データをどう扱うかは、プランとアカウントの設定で違います。",
    "電話番号、メールアドレス、カード番号、使わない列は消します。",
    "電話番号、メールアドレス、パスワード、カード番号をAIに貼らないでください。",
    "来店した人（attended）には連絡しません。",
    "同意のないSMSは送りません。sms_consent = no も、空欄も、SMSを下書きしません。",
    "メールの同意は SMS の同意を意味しません。",
    "空いていない枠や、メニューが違う枠は案内しません。",
    "繰り返しの無断キャンセルへは、自動で連絡しません。",
    "自動では送信しません。予約、キャンセル、請求も自動では行いません。人が確認して送ります。送る前に、人がすべての文面を承認します。キットは何も変更しません。",
    "AtlasはCalendly、Square、Acuity、Googleカレンダー、Twilio、SMS、メール、その他のサービスとはつながりません。OAuthもAPI呼び出しもなく、データを第三者へ送りません。",
    sessionOnlyNotice,
  ],
  sampleBookingsCsv,
  recoveryLogCsv,
};

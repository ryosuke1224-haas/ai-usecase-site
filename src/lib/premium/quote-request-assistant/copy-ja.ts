import type { JapaneseQuoteCopy } from "./copy-types";

const YOU_PRICE_IT =
  "見積もりはあなたが付けます。送信もあなたがします。キットは何も変更しません。";

const DO_NOT_SEND = "この下書きは送らないでください。";

const NEVER_IN_DRAFT =
  "下書きに価格、価格帯、利益率、仕入先名を入れないでください。";

const NO_AUTOMATIC =
  "送信、編集、取消、支払いの変更は自動では行いません。";

export const japaneseQuoteCopy: JapaneseQuoteCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "見積依頼レビュー",
  publicBody:
    "フォームやメールの見積依頼を貼り付け、オーナーが書いた条件に照らして、確認済みの範囲と最初の返事の下書きを出します。AIは準備します。送るかどうかは人が決めます。キットは何も変更しません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "依頼文に書いてある事実です。",
  needsCheckHelp: "足りない項目です。揃うまで適合判定や下書きをしません。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面の依頼、名前、場所、広さ、日付はすべて架空です。実在の取引はありません。フォーム、受信箱、CRM、その他のライブシステムとはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "依頼と条件",
    "ラベルを付けて抜き出す",
    "FIT: YES",
    "事実を確認する",
    "質問と下書き",
    "見積もりと送信は自分で",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "見積依頼整理のプレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で1件の見積依頼を確認するためのプロンプト、ワークシート、チェックリストです。AIは依頼に書かれた範囲を抜き出し、あなたが書いた条件を適用します。確認済みの項目を依頼文と突き合わせ、見積もりと返信は自分で行います。キットは何も変更しません。",
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
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。見積もりはあなたが付けます。送信もあなたがします。キットは何も変更しません。",
  demo: {
    step1Lead:
      "この依頼は架空です。フォーム、受信箱、CRMとはつながっていません。Atlas は接続も、アップロードも、送信もしません。",
    requesterLabel: "依頼者",
    receivedLabel: "受付日",
    requestHeading: "ウェブサイトフォームの依頼（架空）",
    rulesHeading: "オーナーが書いた条件",
    rulesTableLabel: "資格条件",
    step2Lead:
      "AIは依頼に書かれたことだけを抜き出します。おおよその言い方はそのまま残します。数字は作りません。",
    confirmedLine:
      "work_type = deck replacement。size = maybe 300 sq ft。location = Riverside。timeline stated = hoping before July。material mentioned = composite。requester = Jordan Hale。received = 2026-05-12。source = website form。",
    interpretation:
      "「if not crazy expensive」から予算に敏感と読む。「before July」は希望の時期であり、確定した着工日ではない。既存のデッキの状態は不明。",
    recommended: `トラッカーの行を追加する。2つの質問をするか、見積もりする。${YOU_PRICE_IT}`,
    step3Lead:
      "適合は、書いた条件だけを使います。カタログに近いが載っていない作業は、自動では断りません。",
    fitReasons:
      "Riverside は service_area に入る。300 は minimum_size_sq_ft 150 以上。deck replacement は提供対象。",
    fitNoExample:
      "Mesa の屋根工事の依頼は FIT NO（カタログ外、サービスエリア外）。",
    needsCheckExample:
      "Riverside の曲がった特注デッキで、カタログにないものは NEEDS YOUR CHECK（要確認）であり、FIT NO ではない。",
    step4Lead:
      "見積もりや送信の前に、確認済みの項目を依頼文と突き合わせます。",
    factConfirmed: "location = Riverside。",
    factButton: "依頼文と事実を照合する",
    factTableLabel: "依頼文との照合",
    factColumns: ["項目", "確認済みの行", "依頼文", "結果"],
    factResult: "一致",
    step5Lead: "確認の質問が2つと、返事の下書きです。下書きは送っていません。",
    questionsHeading: "質問",
    questions: [
      "既存のデッキの状態はどうですか？",
      "見積もりに手すりの交換も含めますか？",
    ],
    draftHeading: "返事の下書き",
    draftText:
      "Jordan 様、Riverside でのデッキ交換のご依頼（おおよそ 300 sq ft、複合材のご希望、7月前の完了希望）を受け取りました。範囲を確認し、見積もり前に質問でご連絡します。",
    doNotSend: DO_NOT_SEND,
    step6Title: YOU_PRICE_IT,
    step6Body:
      "トラッカーの行を追加し、見積もりし、返信は自分で送ります。キットは行案を出しますが、行は作りません。",
    trackerLabel: "提案するトラッカー行",
    step6Boundary:
      "Atlas はフォーム、受信箱、CRMには接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "見積依頼の準備",
      intro:
        "1件の確認は、この順で進めます。本番の依頼の前に、架空の依頼文で練習してください。",
    },
    {
      id: "extraction-prompt",
      title: "範囲抽出のプロンプト",
      intro:
        "条件ブロックと一緒にこのプロンプトを貼り、依頼文を貼ります。書かれた項目だけを抜き出し、おおよその言い方を残し、確認済みとAIの解釈を分けて書きます。",
    },
    {
      id: "fit-review-prompt",
      title: "適合確認のプロンプト",
      intro:
        "抽出のあとに使います。書いた条件を先に適用し、カタログに近いが載っていない作業を自動では断りません。",
    },
    {
      id: "rules-worksheet",
      title: "資格条件のワークシート",
      intro:
        "サービスエリア、最小の広さ、提供する作業、対象外の作業、下書きに出してはいけない社内メモを書きます。できた条件はプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "tracker-template",
      title: "見積トラッカーのひな形",
      intro:
        "ガイドと同じ、架空の QR-1001 の行があります。fit の値は YES、NO、NEEDS YOUR CHECK。status の値は needs pricing、waiting on answers、declined、quoted、sent です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "action-review-checklist",
      title: "返信前の確認リスト",
      intro: "依頼者に連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
    },
    {
      id: "sample-request",
      title: "架空の依頼文",
      intro:
        "ガイドと同じ、Jordan Hale のデッキ依頼と、Mesa の屋根工事（FIT NO）の例です。本番の前にプロンプトと一緒に貼って練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "判定の前に条件を書きます。サービスエリア、最小の広さ、提供する作業、対象外の作業、下書きに出してはいけない社内メモです。何が良い依頼か、どの文言を社内だけにするかは人が決めます。",
    "フォームやメールから1件の見積依頼を平文でコピーします。支払い情報、パスワード、使わない列は消します。これは貼り付けた依頼の確認です。受信箱やフォームとの接続ではありません。どの依頼を見るか、何を残すかは人が決めます。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。ファイルを渡せないときや渡したくないときは、文を貼るか、この依頼にはAIを使いません。",
    "範囲抽出のプロンプトと、資格条件のワークシートの条件、サービスカタログ、依頼文を貼ります。",
    "確認済みの項目を依頼文と突き合わせます。",
    "適合確認のプロンプト（Fit Review Prompt）は、同じ条件と一緒に、FIT ラベルを受け入れる前に名前どおり貼ります。この2つ目のプロンプトは手順に残し、飛ばさないでください。",
    "返信前の確認リストを使い、依頼者に連絡する前に確認します。質問する、見積もりする、断る、何もしないかは人が決めます。見積もりと送信は自分のメールやCRMで行います。キットは送信、編集、取消、支払いをしません。",
  ],
  extractionPrompt: `貼り付けた1件の見積依頼から、書かれた範囲を抜き出す手伝いをしてください。準備するのはあなたです。決めるのは私です。

広さ、予算、住所、名前、日付を作らないでください。送らないでください。見積もりしないでください。トラッカーの行を追加しないでください。見積もりと送信は私自身が行うか、行わないと決めます。

貼り付けるもの:
1. 資格条件のワークシートの条件
2. サービスカタログ（提供する作業）
3. フォームまたはメールから平文でコピーした見積依頼1件

ルール
- 依頼に書かれたことだけを抜き出す。おおよその言い方はそのまま残す。依頼が「maybe 300 sq ft」なら、確認済みの広さは「maybe 300 sq ft」であり、300.00 ではない。
- 確認済み、AIの解釈、推奨アクションを分けて書く。
- 確認済みに入れてよいのは、作業の種類、広さ、場所、書かれた時期、指名された材料、依頼者、受付日、経路 — 依頼に書かれているときだけ。
- 「if not crazy expensive」のような文言は、予算への敏感さとしてのAIの解釈であり、確認済みの予算ではない。
- 「hoping before July」のような希望は、希望の時期であり、確定した着工日ではない。
- ${NEVER_IN_DRAFT}

出力:
確認済み: work_type、size、location、timeline stated、material mentioned、requester、received、source。書かれた言葉だけを使う。
AIの解釈: 予算への敏感さ、構造の状態が不明なこと、日付が希望かどうか。事実として書かない。
要確認: 場所、広さ、作業の種類が欠けている、またはカタログに近いが載っていない作業。
質問: 確認のための質問だけ。事実を作って質問を避けるのは禁止。
返事の下書き（未送信）: 依頼者に礼を言い、確認済みの範囲を繰り返し、見積もり前に続きを連絡すると書く。下書きに価格を入れない。
トラッカー: 行案だけ。行は追加しない。
推奨アクション（人が決める）: トラッカーの行を追加する、質問する、見積もりする。

作らない。送らない。見積もりしない。トラッカーの行を追加しない。${NO_AUTOMATIC}`,
  extractionPromptIntro:
    "条件ブロックと一緒にこのプロンプトを貼り、依頼文を貼ります。書かれた項目だけを抜き出し、おおよその言い方を残し、確認済みとAIの解釈を分けて書きます。",
  fitPrompt: `貼り付けた1件の見積依頼を、書いた資格条件に照らして適合を判断する手伝いをしてください。準備するのはあなたです。決めるのは私です。

FIT ラベルの前に、資格条件を適用してください。一般的な推測だけで適合を決めないでください。

送らないでください。見積もりしないでください。社内メモを漏らさないでください。CRMを編集しないでください。${YOU_PRICE_IT}

貼り付けるもの:
1. 資格条件のワークシートの条件（サービスエリア、最小の広さ、提供する作業、対象外、下書き禁止メモ）
2. 範囲抽出のプロンプトからの確認済み項目
3. 元の依頼文

ルール
- FIT YES は、場所がサービスエリア内、広さが最小以上、作業の種類が提供対象のときだけ。当てはまる条件を示す。
- FIT NO は、対象外の作業、またはサービスエリア外のとき。当てはまる条件を示す。
- 場所、広さ、作業の種類が欠けているときは要確認。サービスエリアを仮定しない。広さを推測しない。
- カタログに近いが載っていない作業は要確認。FIT NO にしない。
- カタログに近く、まだ良い見込みかもしれない珍しい依頼を FIT NO にしない。
- ${NEVER_IN_DRAFT}

出力:
FIT YES、FIT NO、または要確認（NEEDS YOUR CHECK）と、当てはまる条件。
理由: 適用した書いた条件。
推奨アクション（人が決める）: 見積もりする、断る、追加で聞く。送らない。見積もりしない。

${YOU_PRICE_IT}`,
  fitPromptIntro:
    "抽出のあとに使います。書いた条件を先に適用し、カタログに近いが載っていない作業を自動では断りません。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  copyText: "テキストをコピー",
  serviceAreaLabel: "サービスエリア",
  minimumSizeLabel: "最小の広さ（sq ft）",
  servicesOfferedLabel: "提供する作業",
  outOfScopeLabel: "対象外の作業（1行に1つ）",
  neverInDraftLabel: "下書きに出してはいけない社内メモ",
  generateRules: "資格条件を作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの資格条件",
  copyRules: "条件をコピー",
  serviceAreaError: "サービスエリアを入力してください。",
  minimumSizeError: "最小の広さを入力してください。",
  reviewRules: ({ serviceArea, minimumSize, servicesOffered, outOfScope, neverInDraft }) => {
    const lines = [
      `サービスエリア: ${serviceArea.trim()}。`,
      `最小の広さ: ${minimumSize.trim()} sq ft。`,
      `提供: ${servicesOffered.trim()}。`,
      ...(outOfScope.length > 0 ? [`対象外: ${outOfScope.join("; ")}。`] : []),
      NEVER_IN_DRAFT,
      ...(neverInDraft.trim()
        ? [`下書き禁止メモ: ${neverInDraft.trim()}。`]
        : []),
      "FIT ラベルの前に、これらの条件を適用する。",
      "場所が欠けているときは要確認。サービスエリアを仮定しない。",
      "カタログに近いが載っていない作業は要確認。FIT NO にしない。",
      "送らない。見積もりしない。トラッカーの行を追加しない。",
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "確認済みの事実は、すべて依頼文に書かれている。",
    "確認済み、AIの解釈、推奨アクションは分けて書いてある。",
    "適合は、書いた資格条件だけを使った。",
    "カタログに近い珍しい依頼を FIT NO にしていない。",
    "場所、広さ、作業の種類が欠けているときは要確認であり、場所を仮定していない。",
    "下書きに価格、価格帯、利益率、仕入先名がない。",
    "下書きに出してはいけない社内メモが、下書きに入っていない。",
    "質問する、見積もりする、断るかを自分で決める。",
    "返信は自分で送る。キットは何も変更しません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の依頼の前にリストをリセットしてください。返信を送るかどうかは、自分で決めます。",
  sampleIntro:
    "ガイドと同じ、Jordan Hale のデッキ依頼と、Mesa の屋根工事（FIT NO）の例です。本番の前にプロンプトと一緒に貼って練習します。",
  trackerIntro:
    "ガイドと同じ、架空の QR-1001 の行があります。fit の値は YES、NO、NEEDS YOUR CHECK。status の値は needs pricing、waiting on answers、declined、quoted、sent です。値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "依頼者に連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
  fictionalBadge: "架空",
  safetyRules: [
    "依頼を貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "支払い情報や、使わない列は消します。",
    "パスワード、カード番号、口座番号はAIに貼りません。",
    NEVER_IN_DRAFT,
    "下書きをキットから送らないでください。",
    "カタログに近い珍しい依頼を FIT NO にしないでください。その場合は要確認にし、良い見込みを黙って落とさないでください。",
    `${NO_AUTOMATIC}見積もりと送信は自分で行います。キットは何も変更しません。`,
    "Atlas はフォーム、受信箱、CRM、表計算、その他のサービスには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

import type { JapaneseWinbackCopy } from "./copy-types";

const YOU_SEND_IT = "送るのは人です。自動では送信しません。";
const DO_NOT_INVENT = "オファーリストにない割引は作らないでください。";
const RETURN_NOT_PROOF = "再来は、メッセージが原因だった証拠にはなりません。";
const CONFIRM_CONSENT = "連絡の前に同意を確認してください。";
const LAPSE_DATE_SENTENCE =
  "離脱日より後に来た人は対象にしないでください。";
const SKIP_RULES_FIRST = "先にスキップルール";

export const japaneseWinbackCopy: JapaneseWinbackCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "久々のお客様の再来案内",
  publicBody:
    "個人情報を除いた顧客の書き出しから、同意とスキップルールで絞り、VIPを先にした再案内の待ち行列を作ります。下書きは、書いたオファーだけを使います。あとでPOSの書き出しを見て、誰が戻ったかを確認します。AIは待ち行列を準備します。送るかどうかは人が決めます。自動では送信しません。POS、メール、SMSにはつながりません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "顧客の書き出しと、あなたのルールに書いてある事実です。",
  needsCheckHelp:
    "人が確認する不足です。欠けた項目や、VIP・オファーがはっきりしないときです。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面のお客様、名前、来店日、メニュー、同意、オファー、再来の結果はすべて架空です。実在の顧客データは使いません。Square、Mindbody、POS、メール、SMS、その他のライブシステムにはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "顧客の書き出し",
    "先にスキップルール",
    "VIPを先に、それから下書き",
    "事実を確認する",
    "あとからの再来確認",
    "送るのは人",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "久々のお客様への再案内プレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で顧客の書き出しを確認するためのプロンプト、ワークシート、チェックリストです。AIは先にスキップルールを適用し、VIPを先に並べ、書いたオファーだけから下書きします。宛先は自分の名簿から選び、自分のメールやSMSから送るか、送らないと決めます。自動では送信しません。オファーリストにない割引は作りません。",
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
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。送るのは人です。自動では送信しません。",
  demo: {
    step1Lead:
      "この顧客表は架空です。Square、Mindbody、POS、メール、SMSとはつながっていません。Atlas は接続も、アップロードも、送信もしません。",
    asOfLabel: "as_of（架空）",
    lapseLabel: "lapse_if_last_visit_before",
    vipLabel: "vip_if_visits_12mo",
    skipOneTimeLabel: "skip_one_time_buyers",
    skipOneTimeValue: "yes",
    offersHeading: "書いたオファー（架空）",
    vipOfferLine: "10% off next color（VIPのみ）",
    occasionalOfferLine: "complimentary consult（一般）",
    exportHeading: "顧客の書き出し（架空）",
    exportTableLabel: "顧客の書き出し",
    contactLogLine: "今期の連絡記録: R. Wells contacted 2026-06-01",
    step2Lead:
      "セグメント、順位、下書きの前に、スキップルールを先に適用します。外した行には理由を残します。先に下書きして、あとから外してはいけません。",
    skippedLabel: "外した行",
    skipped: [
      `A. Chen（最終来店 2026-06-01 は離脱日より後）。${LAPSE_DATE_SENTENCE}`,
      "M. Ortiz（marketing_consent が no）。",
      "K. Singh（do_not_contact が yes）。",
      "S. Diaz（1回来店; visits_12mo = 1）。",
      "R. Wells（今期の連絡記録ですでに連絡済み）。",
    ],
    lapseDateSentence: LAPSE_DATE_SENTENCE,
    step3Lead:
      "残った行は VIP を先に、同じ区分内では最終来店からの日数が長い順です。下書きは書き出しの項目と、書いたオファーだけを使います。",
    queueTableLabel: "VIP優先の再案内待ち行列",
    drafts: [
      {
        rank: "1",
        first: "J. Rivera",
        segment: "VIP",
        confirmed:
          "最終来店 2026-02-03（132日）; 最終メニュー Cut & color; 12か月で11回来店; marketing consent yes。区分: VIP。",
        draft:
          "Cut & color（2月3日）のご利用からしばらく経ちました。よろしければ、次回カラー 10% off をご案内できます。",
      },
      {
        rank: "2",
        first: "L. Park",
        segment: "VIP",
        confirmed:
          "最終来店 2026-02-15（120日）; 最終メニュー Cut; 12か月で10回来店; marketing consent yes。区分: VIP。",
        draft:
          "Cut（2月15日）のご利用からしばらく経ちました。よろしければ、次回カラー 10% off をご案内できます。",
      },
      {
        rank: "3",
        first: "T. Brooks",
        segment: "occasional",
        confirmed:
          "最終来店 2026-03-01（106日）; 最終メニュー Massage; 12か月で4回来店; marketing consent yes。区分: occasional。",
        draft:
          "Massage（3月1日）のご利用からしばらく経ちました。よろしければ、complimentary consult をご案内できます。",
      },
    ],
    interpretation: "最終来店からの日数は、来なくなった理由の証明にはなりません。",
    recommended: `宛先は自分の名簿から選び、自分のツールから送ってください。${YOU_SEND_IT} ${DO_NOT_INVENT} ${CONFIRM_CONSENT}`,
    noInventLine: "どの下書きも、書いたリストの外のオファーは使いません。",
    step4Lead:
      "誰かに連絡する前に、確認済みの項目を書き出しの行と突き合わせます。",
    factConfirmed:
      "J. Rivera。確認済み: 最終来店 2026-02-03（132日）; 最終メニュー Cut & color; 12か月で11回来店; marketing consent yes。区分: VIP。",
    factButton: "書き出しの行と突き合わせる",
    factTableLabel: "書き出しの行との照合",
    factColumns: ["項目", "確認済みの行", "書き出しの行", "結果"],
    factResult: "一致",
    step5Lead:
      "あとからの架空POS書き出し as_of 2026-07-20。再来か、まだ離脱かは、新しい最終来店日で判断します。結果は連絡記録に自分で書きます。",
    returnOutcomes: [
      "J. Rivera 再来（最終来店 2026-07-01）",
      "L. Park まだ離脱（最終来店 2026-02-15）",
      "T. Brooks まだ離脱（最終来店 2026-03-01）",
    ],
    returnNotProof: RETURN_NOT_PROOF,
    confirmConsent: CONFIRM_CONSENT,
    stillSkipped: [
      "M. Ortiz（marketing_consent が no）。",
      "K. Singh（do_not_contact が yes）。",
    ],
    step6Title: YOU_SEND_IT,
    doNotInvent: DO_NOT_INVENT,
    step6Body:
      "宛先は自分の連絡先から選び、自分のメールやSMSから送るか、送らないと決めます。送信、編集、取消、支払いは自動では行いません。確認済み、AIの解釈、推奨アクションは、プレミアムキットでも分けて残します。",
    step6Boundary:
      "Atlas は Square、Mindbody、POS、メール、SMSには接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "再案内の準備",
      intro:
        "1回の確認で、この順に進めます。本番の名簿の前に、架空の顧客書き出しで練習してください。",
    },
    {
      id: "skip-rules-prompt",
      title: "先にスキップルールのプロンプト",
      intro:
        "ルールと一緒にこのプロンプトを貼り、顧客の行と今期の連絡記録を貼ります。先にスキップルールを適用し、外した理由を残し、確認済みとAIの解釈を分けます。",
    },
    {
      id: "draft-prompt",
      title: "VIP優先の下書きプロンプト",
      intro:
        "スキップルールのあとにだけ使います。VIPと一般を分け、VIPを先に並べ、最終メニュー、最終来店日、書いたオファーだけから1通ずつ下書きします。",
    },
    {
      id: "return-check-prompt",
      title: "再来確認プロンプト",
      intro:
        "あとからのPOS書き出しのあとに使います。再来かまだ離脱かを付け、再来はメッセージの効果の証明ではないと注意します。",
    },
    {
      id: "rules-worksheet",
      title: "離脱・VIP・オファーのルール",
      intro:
        "離脱の基準日、VIPの来店回数、1回来店を外すか、書いたオファーを決めます。できたルールはプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "contact-log-template",
      title: "連絡記録のひな形",
      intro:
        "ガイドと同じ、架空の J. Rivera の drafted_not_sent と returned の行です。action と outcome の値は英語のまま記録します。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "action-review-checklist",
      title: "送信前の確認リスト",
      intro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
    },
    {
      id: "sample-customers",
      title: "架空の顧客書き出し",
      intro:
        "ガイドと同じ、架空の8行です。プロンプトと一緒に貼って、本番の名簿の前に練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "下書きの前に再案内のルールを書きます。離脱の基準日（この日より前の最終来店を離脱とする）、直近12か月のVIP来店回数、1回来店を外すか、下書きが使ってよい書いたオファーです。基準日、VIPの回数、1回来店の扱い、実際に出すオファーは人が決めます。",
    "最終来店日または最終購入日、最終メニューまたは商品、直近12か月の来店回数、marketing_consent / do_not_contact を含む顧客を書き出し、貼り付けやアップロードの前にメール、電話、住所を外します。今期の連絡記録も開きます。残す列は人が選びます。これは書き出しの確認です。Square、Mindbody、POS、メール、SMSにはつながりません。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイルを渡せないときや渡したくないときは、行を文字で貼るか、このデータにはAIを使いません。",
    "先にスキップルールのプロンプトと、離脱・VIP・オファーのルールを貼り、顧客の行と今期すでに連絡した名前を添付するか貼ります。",
    `AIは${SKIP_RULES_FIRST}を適用します。marketing_consent がない行、do_not_contact、今期すでに連絡済み、最終来店が離脱日より後、1回来店を外す設定のときの1回来店を外します。外した行には理由を残します。外した行に別の個人メモを送るかは人が決めます。`,
    "VIP優先の下書きプロンプトは、スキップルールのあとにだけ使います。VIPと一般を分け、待ち行列の各行に、書いたオファーだけから1通下書きします。VIPやオファーがはっきりしないときは要確認にし、オファーを作りません。",
    "送信前の確認リストを使い、宛先は自分の名簿から選び、自分のメールやSMSから送るか、送らないと決めます。自動では送信しません。キットは送信、編集、取消、支払いをしません。",
    "再来確認プロンプトは、あとからのPOS書き出しのあとに使い、連絡記録に再来かまだ離脱かを自分で書きます。",
  ],
  skipRulesPrompt: `貼り付けた顧客の書き出しと再案内のルールから、離脱したお客様の戻り待ち行列を作る手伝いをしてください。準備するのはあなたです。決めるのは私です。

${SKIP_RULES_FIRST}。セグメント、順位、下書きの前にスキップルールを適用してください。先に下書きして、あとから外してはいけません。

割引、個人情報、期限は作らないでください。送信しないでください。自動では送信しません。

貼り付けるもの:
1. 離脱・VIP・オファーのルール（lapse_if_last_visit_before, vip_if_visits_12mo, skip_one_time_buyers, 書いたオファー）
2. 顧客の書き出し（first, last_visit, last_service, visits_12mo, marketing_consent, do_not_contact）
3. 今期すでに連絡した名前の連絡記録

ルール
- 先頭に「${SKIP_RULES_FIRST}」と書く。
- marketing_consent が no または空欄の行は外す。理由は marketing_consent が no、または marketing_consent が空欄。
- do_not_contact が yes の行は外す。理由は do_not_contact が yes。
- 今期の連絡記録ですでに連絡済みの行は外す。理由は今期すでに連絡済み。
- last_visit がオーナーの lapse_if_last_visit_before 以降の行は外す。理由と次の文を出す: ${LAPSE_DATE_SENTENCE}
- skip_one_time_buyers がオンなら、visits_12mo が 1 の行は外す。理由は1回来店。
- 残った行で last_visit、last_service、visits_12mo、marketing_consent が欠けているときは下書きしない。要確認に入れる。
- VIPやオファーがはっきりしないときも要確認に入れ、オファーを作らない。
- 確認済み（書き出しとルールにある事実）、AIの解釈、推奨アクションを分けて書く。
- 最終来店からの日数は、来なくなった理由の証明にはならない。その推測はAIの解釈であり、確認済みの事実ではない。
- 下書きは下書きだけ。作らない。送らない。

出力
${SKIP_RULES_FIRST}
書き出しの基準日時点の待ち行列（スキップ後の残り）
外す: 外した行とその理由
AIの解釈: 最終来店からの日数は、来なくなった理由の証明にはならない
推奨アクション（人が決める）: 人が確認すること。作らない。送らない。

作らない。送らない。送るのは人です。自動では送信しません。`,
  skipRulesPromptIntro:
    "ルールと一緒にこのプロンプトを貼り、顧客の行と今期の連絡記録を貼ります。先にスキップルールを適用し、外した理由を残し、確認済みとAIの解釈を分けます。",
  draftPrompt: `スキップルールのあとにだけ、再案内の文面を下書きしてください。準備するのはあなたです。決めるのは私です。

このプロンプトは、${SKIP_RULES_FIRST}が終わり、外した行を分けたあとにだけ使います。

書いたオファーにない割引、個人情報、期限は作らないでください。送信しないでください。送るのは人です。自動では送信しません。

貼り付けるもの:
1. 離脱・VIP・オファーのルール（書いたオファーを含む）
2. スキップ後に残った待ち行列の行

ルール
- visits_12mo がオーナーのVIP基準以上なら VIP、それ以外は occasional。
- VIP を先に並べる。同じ区分内では最終来店からの日数が長い順。
- 待ち行列の各行に、最終メニューまたは商品、最終来店日、その区分の書いたオファーだけから1通下書きする。
- VIPの下書きはVIP向けオファーだけ。occasional の下書きは occasional 向けオファーだけ。
- VIPやオファーがはっきりしないときは要確認にし、オファーを作らない。
- 作らない。送らない。送るのは人です。

出力
VIP優先、そのあと occasional の待ち行列。確認済みの項目と下書きを1通ずつ。
AIの解釈: 最終来店からの日数は、来なくなった理由の証明にはならない。
推奨アクション（人が決める）: 宛先は自分の名簿から選び、自分のツールから送る。送るのは人です。自動では送信しません。

作らない。送らない。送るのは人です。`,
  draftPromptIntro:
    "スキップルールのあとにだけ使います。VIPと一般を分け、VIPを先に並べ、最終メニュー、最終来店日、書いたオファーだけから1通ずつ下書きします。",
  returnCheckPrompt: `あとからのPOS書き出しで、誰が戻ったかを確認する手伝いをしてください。準備するのはあなたです。決めるのは私です。

再来の結果は作らないでください。下書きが再来の原因だと言わないでください。送信しないでください。

貼り付けるもの:
1. 前回の待ち行列の名前
2. あとからのPOS書き出し（first と last_visit）
3. 連絡記録

ルール
- 前回の as_of より後に last_visit が進んだら再来、そうでなければまだ離脱。
- 再来は、メッセージが原因だった証拠にはならない。
- 連絡記録の結果を提案する。書くのは人です。
- 再来の結果を作らず、下書きが効いたとも言わない。

出力
あとからの書き出し日時点の再来確認
確認済み: 待ち行列の各名前を再来かまだ離脱か、新しい last_visit と一緒に
AIの解釈: ${RETURN_NOT_PROOF}
推奨アクション（人が決める）: 連絡記録に再来かまだ離脱かを書く

作らない。連絡記録は自分で更新する。送るのは人です。自動では送信しません。`,
  returnCheckPromptIntro:
    "あとからのPOS書き出しのあとに使います。再来かまだ離脱かを付け、再来はメッセージの効果の証明ではないと注意します。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  lapseLabel: "最終来店がこの日より前なら離脱",
  vipLabel: "直近12か月の来店がこの回数以上なら VIP",
  skipOneTimeLabel: "1回来店のお客様を外す",
  vipOffersLabel: "VIP向けオファー（1行に1件）",
  occasionalOffersLabel: "一般向けオファー（1行に1件）",
  generateRules: "再案内のルールを作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの再案内ルール",
  copyRules: "ルールをコピー",
  lapseDateError: "離脱の基準日を入力してください。",
  vipFloorError: "VIPの来店回数は1以上で入力してください。",
  offerListError: "書いたオファーを1件以上入力してください。",
  reviewRules: ({ lapseBefore, vipFloor, skipOneTime, vipOffers, occasionalOffers }) => {
    const lines = [
      "下書きの前に、先にスキップルールを適用する。",
      "marketing_consent が no または空欄のときは外す。",
      "do_not_contact が yes のときは外す。",
      "今期すでに連絡済みの行は外す。",
      `最終来店が ${lapseBefore} より前なら離脱。`,
      `visits_12mo が ${vipFloor} 以上なら VIP。`,
      ...(skipOneTime ? ["1回来店のお客様を外す。"] : []),
      ...(vipOffers.length > 0 ? [`VIP向けオファー: ${vipOffers.join("；")}。`] : []),
      ...(occasionalOffers.length > 0
        ? [`一般向けオファー: ${occasionalOffers.join("；")}。`]
        : []),
      "VIPやオファーがはっきりしないときは要確認にし、オファーを作らない。",
      DO_NOT_INVENT,
      `${YOU_SEND_IT}`,
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "セグメント、順位、下書きの前に、先にスキップルールを適用した。",
    "marketing_consent がない行は、理由を見せて外した。",
    "do_not_contact の行は、理由を見せて外した。",
    "確認済みの各項目は、書き出しの行と一致している。",
    "下書きのオファーは、その区分の書いたオファーリストにある。",
    "VIPの行は、一般の行より先に並べた。",
    "確認済み、AIの解釈、推奨アクションは分けて書いてある。",
    "あとの再来を、メッセージの効果の証明にはしない。",
    "宛先は自分の名簿から選び、自分のメールやSMSから自分で送る。送るのは人です。自動では送信しません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の書き出しの前にリストをリセットしてください。送るかどうかは、自分で決めます。",
  sampleIntro:
    "ガイドと同じ、架空の8行です。プロンプトと一緒に貼って、本番の名簿の前に練習します。CSVは顧客の行だけです。",
  contactLogIntro:
    "ガイドと同じ、架空の J. Rivera の drafted_not_sent と returned の行です。action の値は skipped_no_consent、skipped_dnc、skipped_recent、skipped_one_time、skipped_already_contacted、drafted_not_sent、sent_by_owner、not_sent。outcome の値は returned、still_lapsed、unknown。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "誰かに連絡する前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
  fictionalBadge: "架空",
  safetyRules: [
    "顧客の書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "メール、電話、住所など、この手順に不要な列は外します。",
    "電話番号、メールアドレス、パスワード、カード番号はAIに貼りません。",
    "marketing_consent がない人、do_not_contact の人には連絡しません。",
    DO_NOT_INVENT,
    RETURN_NOT_PROOF,
    "同意の列がないと、オプトアウトした人をスキップルールで守れません。",
    `${YOU_SEND_IT}送信、編集、取消、支払いは自動では行いません。`,
    "Atlas は Square、Mindbody、POS、メール、SMSには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

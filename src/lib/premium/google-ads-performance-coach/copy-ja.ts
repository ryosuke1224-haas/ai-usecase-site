import type { JapaneseAdsCopy } from "./copy-types";

const NO_AUTOMATIC_CHANGE =
  "入札、予算、配信設定、キャンペーンの変更は自動では行いません。";

const YOU_CHANGE_IT =
  "変更は Google Ads で自分で行います。キットは何も変更しません。";

const DO_NOT_CHANGE_BIDS = "まだ入札は変えないでください。";

export const japaneseAdsCopy: JapaneseAdsCopy = {
  publicEyebrow: "プライベートプレビュー",
  publicTitle: "Google Ads 運用チェック",
  publicBody:
    "予算を動かす前に、主コンバージョンが有効な成果かどうかを確認し、期間の変化を計算式つきで示します。AIは確認の材料を用意します。入札、予算、配信設定、キャンペーンの変更は自動では行いません。Google Ads で何かを変えるかどうかは人が決めます。キットは何も変更しません。",
  labelsTitle: "この画面でのラベル",
  confirmedHelp: "書き出しやコンバージョンアクション表に書いてある事実です。",
  needsCheckHelp: "人が確認する必要がある欠けです。効率の順位づけの前に見ます。",
  interpretationHelp: "AIの推測です。事実としては扱いません。",
  recommendedHelp: "次の候補です。実行するかは人が決めます。",
  fictionalNotice:
    "この画面のキャンペーン、費用、コンバージョン、ランディングページ、日付はすべて架空です。実在の事業データは使いません。Google Ads、GA4、その他のライブシステムとはつながっていません。",
  demoAria: "ガイド",
  stepLabel: (step, total) => `ステップ ${step} / ${total}`,
  previousStep: "前へ",
  nextStep: "次へ",
  stepTitles: [
    "書き出したレポート",
    "まず測定の確認",
    "計算式を見せて止める",
    "事実を確認する",
    "次の確認に必要なもの",
    "変更は自分で行う",
  ],
  kitEyebrow: "Premium · プライベートプレビュー",
  kitTitle: "Google Ads の見直しプレミアムキット",
  kitBody:
    "ChatGPT、Claude、Gemini で測定を先に確認するためのプロンプト、ワークシート、チェックリストです。AIは主コンバージョンと、あなたが書いた有効な成果を比べます。確認済みの数字は書き出しと突き合わせ、変更は Google Ads で自分で行います。キットは何も変更しません。",
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
    "ログインしています。このPremiumキットはプライベートプレビューです。いま購入手続きはありません。このアカウントには利用権限がないため、キットは閉じたままです。入札、予算、配信設定、キャンペーンの変更は自動では行いません。",
  demo: {
    step1Lead:
      "この表は架空です。Google Ads や GA4 のアカウントとはつながっていません。Atlas は接続も、アップロードも、編集もしません。",
    qualifiedOutcomeLabel: "有効な成果",
    dateRangesLabel: "期間",
    currentExportHeading: "今期のキャンペーン書き出し（架空）",
    previousExportHeading: "前期のキャンペーン書き出し（架空）",
    conversionActionsHeading: "コンバージョンアクション表（架空）",
    ga4Heading: "GA4 ランディングページ表（架空）",
    currentExportLabel: "今期のキャンペーン書き出し",
    previousExportLabel: "前期のキャンペーン書き出し",
    conversionActionsLabel: "コンバージョンアクション表",
    ga4Label: "GA4 ランディングページ表",
    step2Lead:
      "AIは費用の順位づけの前に、各 primary_conversion を有効な成果と比べます。Spring Promo は主コンバージョンが有効な成果ではないため、効率の順位づけから外します。",
    resultsLabel: "測定確認の結果",
    springFailedHeading: "Spring Promo — 不合格",
    springDetail:
      "primary_conversion は page_view であり、form_submit ではありません。コンバージョン = 96。/spring-landing の form_submit_events = 12。",
    springSkipped:
      "効率の順位づけから外す: Spring Promo（主コンバージョンが有効な成果ではない）。",
    brandPassedHeading: "Brand — 合格",
    brandDetail: "primary_conversion は form_submit で、有効な成果と一致します。",
    step3Lead:
      "ワークブックは計算式を隠さず残します。Spring Promo は meaningful = no なので、その数字で費用の順位はつけません。",
    workbookLabel: "計算ワークブック",
    confirmedLines: [
      "Spring Promo の primary_conversion = page_view。有効な成果 = form_submit。",
      "Spring Promo の conversions = 96。/spring-landing の form_submit_events = 12。",
      "/spring-landing の sessions = 1050。Spring Promo の clicks = 1240。",
      "Brand の primary_conversion = form_submit。Brand の conversions = 22。",
    ],
    interpretation:
      "Spring Promo のコンバージョン単価（1860 / 96 = 19.38）は、トラッキングを変えるまで意味がありません。Brand は form_submit が有効な成果と一致するため、あとで期間比較できます。96 と 12 の差は2つの書き出し件数であり、タグ破損の証拠ではありません。",
    recommended:
      "Spring Promo の主コンバージョンを form_submit にし、14日後にもう一度確認します。まだ入札は変えないでください。",
    factConfirmed: "Spring Promo の primary_conversion = page_view。",
    step4Lead:
      "Spring Promo の行を開きます。Google Ads で何かを変える前に、確認済みの項目を書き出しの行と突き合わせます。",
    factButton: "書き出しの行と突き合わせる",
    factTableLabel: "Spring Promo の事実確認",
    factColumns: ["項目", "確認済みの行", "書き出しの行", "結果"],
    factResult: "一致",
    step5Lead:
      "修正後の書き出しはありません。次に見るときは、新しいキャンペーン書き出しが必要です。結果のファイルは作りません。",
    brandPreviousHeading: "Brand の前期ワークブック行",
    brandPreviousLabel: "Brand の前期ワークブック行",
    costChangeLabel: "費用の変化",
    conversionChangeLabel: "コンバージョンの変化",
    searchTermsNeedsCheck: "検索語句の書き出し: 提供なし",
    laterInterpretation:
      "費用が 15 増えただけでは、予算を動かす理由にはなりません。トラッキング変更後の新しいキャンペーン書き出しはありません。",
    rerun: "14日後に、新しいキャンペーン書き出しでもう一度確認します。まだ入札は変えないでください。",
    step6Title: YOU_CHANGE_IT,
    doNotChangeBids: DO_NOT_CHANGE_BIDS,
    boundaries: [
      "Spring Promo の主コンバージョンを form_submit にするか、しないかは自分で決めます。",
      "送信、編集、支払いは自動では行いません。キットは何も変更しません。",
      "待って書き出しを取り直すか、何も変えないか、自分で決めます。",
    ],
    kitBoundary:
      "Atlas は Google Ads や GA4 には接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。",
    kitLink: "プレミアムキットを開く（要ログイン・プライベートプレビュー）",
  },
  sections: [
    {
      id: "setup-checklist",
      title: "Google Ads 見直しの準備",
      intro:
        "1回の確認は、この順で進めます。本番のアカウント書き出しの前に、架空のサンプルで練習してください。",
    },
    {
      id: "measurement-review-prompt",
      title: "測定確認のプロンプト",
      intro:
        "ルールと一緒にこのプロンプトを貼り、コンバージョンアクション表、キャンペーン書き出し、GA4 のランディングページ行を添付するか貼ります。先に測定を確認し、主コンバージョンが有効な成果でないときは効率の順位づけを止めます。",
    },
    {
      id: "period-review-prompt",
      title: "期間比較のプロンプト",
      intro:
        "対象のキャンペーンがすべて測定確認に合格してから使います。今期と前期の書き出しの数字だけでワークブックを埋め、計算式を残します。",
    },
    {
      id: "rules-worksheet",
      title: "有効な成果のワークシート",
      intro:
        "有効な成果を書き、数えないイベントの初期値を確認または外し、対象外にするキャンペーンを並べます。できたルールは測定確認のプロンプトと一緒に貼ります。ここに書いた内容は Atlas に保存されません。",
    },
    {
      id: "workbook-template",
      title: "計算ワークブックのひな形",
      intro:
        "架空の数字と、=1860/96 のような式です。Spring Promo は meaningful = no です。自分の表を始めるときは CSV をコピーします。",
    },
    {
      id: "action-review-checklist",
      title: "変更前の確認リスト",
      intro: "Google Ads で何かを変える前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
    },
    {
      id: "sample-exports",
      title: "架空の書き出しサンプル",
      intro:
        "ガイドと同じ、架空のキャンペーン、前期、コンバージョンアクション、GA4 の行です。測定確認のプロンプトと一緒に貼って、本番の前に練習します。",
    },
    {
      id: "safety-guidance",
      title: "データと安全の案内",
      intro: "",
    },
  ],
  setupSteps: [
    "有効な成果（例: form_submit = 完了した問い合わせフォーム）を書き、数えないイベントを並べます。数字を信じる前に、コンバージョンの意味を自分で決めます。",
    "今期と前期の Google Ads キャンペーンレポートを、campaign、clicks、cost、conversions、primary_conversion、各ファイルの期間つきの CSV で書き出します。これは書き出しの確認であり、ライブ接続ではありません。Atlas は Google Ads や GA4 には接続しません。",
    "Google Ads の目標 > コンバージョン > 概要から、コンバージョンアクションの画面または表を控えます。",
    "同じ2期間の GA4 トラフィック獲得とランディングページのレポートを書き出します。キャンペーン種類が対応していれば検索語句も追加します。残す列は自分で決めます。顧客メールなど、この手順に不要な列は外します。",
    "貼り付けやアップロードの前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイルを渡せないときや渡したくないときは、行を文字で貼るか、このデータにはAIを使いません。",
    "測定確認のプロンプトと、有効な成果のワークシートで作ったルールを貼り、コンバージョンアクション表、キャンペーン書き出し、GA4 のランディングページ行を添付するか貼ります。",
    "期間比較のプロンプトは、対象のキャンペーンがすべて測定確認に合格してから使います。",
    "変更前の確認リストを使い、確認済みの数字を書き出しの行と突き合わせてから、Google Ads を開きます。主コンバージョンを変えるか、待って書き出しを取り直すか、何も変えないかは自分で決めます。変更は Google Ads で自分で行います。キットは何も変更しません。",
  ],
  measurementPrompt: `Google Ads の効率を順位づける前に、測定を確認する手伝いをしてください。準備するのはあなたです。決めるのは私です。

入札は変えないでください。Google Ads アカウントは編集しないでください。クリック、費用、コンバージョン、セッション、イベント、節約額は作らないでください。変更は Google Ads で私自身が行うか、行わないと決めます。

貼り付けるもの:
1. 有効な成果のワークシートで書いた有効な成果と測定ルール
2. 今期と前期の Google Ads キャンペーン書き出し（campaign、clicks、cost、conversions、primary_conversion、各ファイルの期間）
3. 目標 > コンバージョン > 概要のコンバージョンアクション表
4. 同じ期間の GA4 トラフィック獲得とランディングページの行
5. キャンペーン種類が対応しているときの検索語句の書き出し

STEP 1 - まず測定の確認
効率の順位づけ、コンバージョン単価の比較、入札や予算の提案の前に、「まず測定の確認」と書いてください。
期間は各書き出しに書いてある範囲を使います。今日の日付は使いません。キャンペーン書き出しに期間がなければ、順位をつける前に私に聞いてください。

STEP 2 - 有効な成果と比べる
対象のキャンペーンごとに、primary_conversion を私が書いた有効な成果と比べてください。
primary_conversion が有効な成果と一致しないキャンペーンは、効率の順位づけから外します。理由は「主コンバージョンが有効な成果ではない」です。
page_view は、私がそう書いていない限り有効な成果ではありません。
コンバージョンアクション表がない、残った行に campaign、cost、conversions、primary_conversion がない、同じ期間に同じキャンペーン名が2回ある場合は、順位をつけません。要確認に出してください。
対象外にしたキャンペーンは外します。理由は「あなたが対象外にした」です。

STEP 3 - ラベル
各点に次のラベルを付けてください。確認済み（書き出しまたはコンバージョンアクション表にある事実）、AIの解釈（ありうる説明）、推奨アクション。
数字は作らないでください。貼ったファイルの値だけを使います。
Google Ads のコンバージョン数と GA4 のイベント数を同じ指標として扱わないでください。それぞれ確認済みの件数として別々に書いてください。差の原因はAIの解釈です。
GA4 の全ユーザーレポートを、有料の Google トラフィックとして扱わないでください。有料 Google で絞り込まれていなければ、要確認に出してください。
検索語句は任意です。ファイルがなければ、要確認に「検索語句の書き出し: 提供なし」と書いてください。クエリは作らないでください。

出力形式
まず測定の確認
確認済み: 書き出しから取った事実を1行ずつ
効率の順位づけから外す: <campaign>（主コンバージョンが有効な成果ではない）
要確認: 欠けているファイルや行、または「なし」
AIの解釈: 測定確認の不合格は、コンバージョンの数字が有効な成果ではないという意味であり、そのキャンペーンが無駄な支出だと証明したわけではありません
推奨アクション（人が決める）: 追跡の確認、有効な成果を主に設定、待つ、書き出しを取り直す。対象のキャンペーンが測定確認に不合格のあいだは、入札、予算、ステータス、ターゲティングは変えない

支出が無駄だった、変更でお金が浮く、とは書かないでください。送信、編集、支払いは自動では行いません。Google Ads で何かを変える前に、確認済みの数字を書き出しの行と突き合わせます。`,
  measurementPromptIntro:
    "ルールと一緒にこのプロンプトを貼り、コンバージョンアクション表、キャンペーン書き出し、GA4 のランディングページ行を添付するか貼ります。先に測定を確認し、主コンバージョンが有効な成果でないときは効率の順位づけを止めます。",
  periodPrompt: `これは期間比較です。対象のキャンペーンがすべて測定確認に合格してから使ってください。準備するのはあなたです。決めるのは私です。

入札は変えないでください。クリック、費用、コンバージョン、セッション、イベント、節約額は作らないでください。Google Ads アカウントは編集しないでください。変更は Google Ads で私自身が行います。

今期と前期のキャンペーン書き出し、測定ルール、ワークブックの並びを貼ります。書き出しの数字だけでワークブックを埋め、計算式は文字のまま残してください（例: =1860/96）。今期と前期の差は、今期マイナス前期を式の文字として示します。

ルール:
- 貼ったファイルの値だけを使います。修正後の結果ファイルは作らないでください。新しい書き出しがなければ、「新しい書き出しはありません」と書いてください。
- 測定に不合格のキャンペーンのコンバージョン単価は、meaningful = no のときだけ示し、費用の順位づけには使いません。
- 期間の差は2つの書き出しからの計算であり、節約額ではありません。支出が無駄だったとは書かないでください。
- 検索語句は任意です。ファイルがなければ、要確認に「検索語句の書き出し: 提供なし」と書いてください。
- 入札、予算、ステータス、ターゲティングの変更は勧めないでください。許される候補は、待つ、書き出しを取り直す、何も変えない、です。

出力形式
測定に合格したキャンペーンごとに:
確認済み: 各期の clicks、cost、conversions、primary_conversion
=cost/conversions や =current-previous のような計算式つきのワークブック行
AIの解釈: ありうる説明。事実としては書かない
推奨アクション（人が決める）: 待つ、書き出しを取り直す、何も変えない。入札は変えない

確認済み、AIの解釈、推奨アクションは分けて書いてください。送信、編集、支払いは自動では行いません。`,
  periodPromptIntro:
    "対象のキャンペーンがすべて測定確認に合格してから使います。今期と前期の書き出しの数字だけでワークブックを埋め、計算式を残します。",
  copyPrompt: "プロンプトをコピー",
  copied: "コピーしました",
  copyFailed: "自動ではコピーできませんでした。上の文を選んでコピーしてください。",
  copyCsv: "CSVをコピー",
  qualifiedOutcomeLabel: "有効な成果（コンバージョンとして数える前に起きてほしいこと）",
  eventsDoNotCountLabel: "数えないイベント",
  pageViewCheckbox: "page_view は有効な成果として数えない",
  addToCartCheckbox: "add_to_cart は有効な成果として数えない",
  outOfScopeLabel: "対象外にするキャンペーン（1行に1件）",
  generateRules: "測定ルールを作る",
  inputsChanged: "入力が変わりました。コピーする前にもう一度作ってください。",
  rulesTitle: "あなたの測定ルール",
  copyRules: "ルールをコピー",
  qualifiedOutcomeError: "有効な成果を入力してください。",
  reviewRules: ({ qualifiedOutcome, pageViewDoesNotCount, addToCartDoesNotCount, outOfScope }) => {
    const lines = [
      `有効な成果: ${qualifiedOutcome.trim()}。`,
      ...(pageViewDoesNotCount ? ["page_view は有効な成果として数えません。"] : []),
      ...(addToCartDoesNotCount ? ["add_to_cart は有効な成果として数えません。"] : []),
      ...outOfScope.map((name) => `常に対象外: ${name}`),
      "効率の順位づけの前に、まず測定の確認を行います。",
      "主コンバージョンが有効な成果でないときは止めます。入札は変えません。",
      "Google Ads アカウントは編集しません。",
      NO_AUTOMATIC_CHANGE,
      YOU_CHANGE_IT,
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "有効な成果は、コンバージョンの数字を信じる前に書いてあります。",
    "効率の順位づけの前に、まず測定の確認を行いました。",
    "確認済みの数字は、書き出しの行と一致しています。",
    "確認済み、AIの解釈、推奨アクションは分けて書いてあります。",
    "対象のキャンペーンが測定確認に不合格のあいだは、入札や予算の変更を勧めていません。",
    "測定確認に不合格のキャンペーンは、効率の順位づけから外しています。",
    "Google Ads のコンバージョン数と GA4 のイベント数は、別々の確認済みとして書き、無理に一致させていません。",
    "変更は Google Ads で自分で行います。キットは何も変更しません。",
    "推測だけで、ライブの入札、予算、キャンペーンのステータスは変えません。",
  ],
  checkedLabel: "チェック {done} / {total}",
  resetChecklist: "リストをリセット",
  reviewComplete:
    "この回の確認は終わりです。次の確認の前にリストをリセットしてください。Google Ads で何かを変えるかどうかは、自分で決めます。",
  sampleIntro:
    "ガイドと同じ、架空のキャンペーン、前期、コンバージョンアクション、GA4 の行です。測定確認のプロンプトと一緒に貼って、本番の前に練習します。",
  workbookIntro:
    "架空の数字と、=1860/96 のような式です。Spring Promo は meaningful = no です。自分の表を始めるときは CSV をコピーします。",
  checklistIntro: "Google Ads で何かを変える前に使います。進み具合はこのブラウザのセッションにだけ残ります。",
  fictionalBadge: "架空",
  currentSampleLabel: "架空の今期キャンペーン書き出し",
  previousSampleLabel: "架空の前期キャンペーン書き出し",
  conversionSampleLabel: "架空のコンバージョンアクション表",
  ga4SampleLabel: "架空の GA4 ランディングページ表",
  workbookTemplateLabel: "計算ワークブックのひな形",
  safetyRules: [
    "書き出しを貼る前に、チャット履歴、学習への利用、ファイルの保存など、AIツールの設定を確認します。ファイル添付とデータの扱いは、契約、アカウント、管理者設定で違います。",
    "この手順に不要な列、顧客メールは外します。",
    "Google アカウントのパスワード、請求アカウント番号、顧客メールはAIに貼りません。",
    "GA4 の全ユーザーレポートを、有料の Google トラフィックとして扱いません。",
    "Google Ads と GA4 の件数を無理に一致させません。差は2つの確認済みの書き出し件数であり、追跡の不具合と断定しません。",
    "推測だけでライブの入札、予算、キャンペーンのステータスは変えません。測定確認の不合格を、支出が無駄だった証拠とは扱いません。",
    `${NO_AUTOMATIC_CHANGE}${YOU_CHANGE_IT}`,
    "Atlas は Google Ads、GA4、Google Analytics、その他のサービスには接続しません。OAuth も API も使わず、データを第三者へ送りません。",
  ],
};

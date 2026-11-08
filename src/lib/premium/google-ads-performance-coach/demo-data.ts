export const DEMO_PATH = "/blueprints/google-ads-performance-coach";
export const KIT_PATH = "/blueprints/google-ads-performance-coach/kit";

export const FICTIONAL_DATA_NOTICE =
  "All campaigns, costs, conversions, landing pages, and dates on this page are fictional. No real business data is used, and nothing is connected to Google Ads, GA4, or any other live system.";

export const QUALIFIED_OUTCOME = "form_submit (completed contact form)";
export const CURRENT_PERIOD = "2026-09-01 to 2026-09-30";
export const PREVIOUS_PERIOD = "2026-08-01 to 2026-08-31";

export const YOU_CHANGE_IT =
  "You change it in Google Ads. The kit changes nothing.";

export const DO_NOT_CHANGE_BIDS = "Do not change bids yet.";

export const RERUN_SENTENCE =
  "Re-run after 14 days with a new campaign export. Do not change bids yet.";

export const SEARCH_TERMS_MISSING = "Search-terms export: not provided";

export const CAMPAIGN_COLUMNS = [
  "campaign",
  "clicks",
  "cost",
  "conversions",
  "primary_conversion",
] as const;

export const CONVERSION_ACTION_COLUMNS = [
  "conversion_action",
  "category",
  "counting",
  "primary_for",
] as const;

export const GA4_COLUMNS = [
  "ga4_landing",
  "sessions",
  "bounced_sessions",
  "form_submit_events",
] as const;

export const WORKBOOK_COLUMNS = [
  "campaign",
  "period",
  "clicks",
  "cost",
  "conversions",
  "primary_conversion",
  "formula",
  "result",
  "meaningful",
] as const;

export type CampaignRow = {
  campaign: string;
  clicks: string;
  cost: string;
  conversions: string;
  primaryConversion: string;
};

export const CURRENT_CAMPAIGNS: CampaignRow[] = [
  {
    campaign: "Spring Promo",
    clicks: "1240",
    cost: "1860",
    conversions: "96",
    primaryConversion: "page_view",
  },
  {
    campaign: "Brand",
    clicks: "410",
    cost: "290",
    conversions: "22",
    primaryConversion: "form_submit",
  },
];

export const PREVIOUS_CAMPAIGNS: CampaignRow[] = [
  {
    campaign: "Spring Promo",
    clicks: "980",
    cost: "1420",
    conversions: "71",
    primaryConversion: "page_view",
  },
  {
    campaign: "Brand",
    clicks: "385",
    cost: "275",
    conversions: "19",
    primaryConversion: "form_submit",
  },
];

export type ConversionActionRow = {
  conversionAction: string;
  category: string;
  counting: string;
  primaryFor: string;
};

export const CONVERSION_ACTIONS: ConversionActionRow[] = [
  {
    conversionAction: "page_view",
    category: "Page view",
    counting: "Every",
    primaryFor: "Spring Promo",
  },
  {
    conversionAction: "form_submit",
    category: "Submit lead form",
    counting: "One",
    primaryFor: "Brand",
  },
];

export type Ga4LandingRow = {
  landing: string;
  sessions: string;
  bouncedSessions: string;
  formSubmitEvents: string;
};

export const GA4_LANDINGS: Ga4LandingRow[] = [
  {
    landing: "/spring-landing",
    sessions: "1050",
    bouncedSessions: "850",
    formSubmitEvents: "12",
  },
  {
    landing: "/contact",
    sessions: "180",
    bouncedSessions: "76",
    formSubmitEvents: "22",
  },
];

export type WorkbookRow = {
  campaign: string;
  period: string;
  clicks: string;
  cost: string;
  conversions: string;
  primaryConversion: string;
  formula: string;
  result: string;
  meaningful: string;
};

export const WORKBOOK_ROWS: WorkbookRow[] = [
  {
    campaign: "Spring Promo",
    period: CURRENT_PERIOD,
    clicks: "1240",
    cost: "1860",
    conversions: "96",
    primaryConversion: "page_view",
    formula: "=1860/96",
    result: "19.38",
    meaningful: "no",
  },
  {
    campaign: "Brand",
    period: CURRENT_PERIOD,
    clicks: "410",
    cost: "290",
    conversions: "22",
    primaryConversion: "form_submit",
    formula: "=290/22",
    result: "13.18",
    meaningful: "yes",
  },
  {
    campaign: "Brand",
    period: PREVIOUS_PERIOD,
    clicks: "385",
    cost: "275",
    conversions: "19",
    primaryConversion: "form_submit",
    formula: "=275/19",
    result: "14.47",
    meaningful: "yes",
  },
];

export const WORKBOOK_CSV = [
  WORKBOOK_COLUMNS.join(","),
  ...WORKBOOK_ROWS.map((row) =>
    [
      row.campaign,
      row.period,
      row.clicks,
      row.cost,
      row.conversions,
      row.primaryConversion,
      row.formula,
      row.result,
      row.meaningful,
    ].join(","),
  ),
].join("\n");

export const SAMPLE_EXPORTS_CSV = [
  CAMPAIGN_COLUMNS.join(","),
  ...CURRENT_CAMPAIGNS.map((row) =>
    [row.campaign, row.clicks, row.cost, row.conversions, row.primaryConversion].join(","),
  ),
  ["previous_campaign", ...CAMPAIGN_COLUMNS.slice(1)].join(","),
  ...PREVIOUS_CAMPAIGNS.map((row) =>
    [row.campaign, row.clicks, row.cost, row.conversions, row.primaryConversion].join(","),
  ),
  CONVERSION_ACTION_COLUMNS.join(","),
  ...CONVERSION_ACTIONS.map((row) =>
    [row.conversionAction, row.category, row.counting, row.primaryFor].join(","),
  ),
  GA4_COLUMNS.join(","),
  ...GA4_LANDINGS.map((row) =>
    [row.landing, row.sessions, row.bouncedSessions, row.formSubmitEvents].join(","),
  ),
].join("\n");

export const SPRING_PROMO_FACT_CHECK = {
  campaign: "Spring Promo",
  confirmed: "Spring Promo primary_conversion = page_view.",
  rows: [
    { field: "primary_conversion", confirmed: "page_view", exportValue: "page_view" },
    { field: "conversions", confirmed: "96", exportValue: "96" },
    { field: "cost", confirmed: "1860", exportValue: "1860" },
  ],
};

export const BRAND_PERIOD_CHANGE = {
  costFormula: "=290-275",
  costChange: "15",
  conversionFormula: "=22-19",
  conversionChange: "3",
};

export const CONFIRMED_LINES = [
  "Spring Promo primary_conversion = page_view. Qualified outcome = form_submit.",
  "Spring Promo conversions = 96. /spring-landing form_submit_events = 12.",
  "/spring-landing sessions = 1050. Spring Promo clicks = 1240.",
  "Brand primary_conversion = form_submit. Brand conversions = 22.",
] as const;

export const AI_INTERPRETATION_TEXT =
  "Spring Promo cost per conversion (1860 / 96 = 19.38) is not meaningful until tracking changes. Brand can use a later period review because form_submit matches the qualified outcome. The 96 vs 12 gap is two export counts, not proof of a broken tag.";

export const RECOMMENDED_ACTION_TEXT =
  "Set form_submit as primary for Spring Promo, then re-run in 14 days. Do not change bids yet.";

export const LATER_RUN_INTERPRETATION =
  "A cost change of 15 is not a reason to move budget. No new campaign export was provided after a tracking change.";

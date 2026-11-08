export const DEMO_PATH = "/blueprints/quote-request-assistant";
export const KIT_PATH = "/blueprints/quote-request-assistant/kit";

export const FICTIONAL_DATA_NOTICE =
  "All requests, names, locations, sizes, and dates on this page are fictional. No real business data is used, and nothing is connected to a form, inbox, CRM, or any other live system.";

export const REQUEST_TEXT =
  "Need our back deck redone, maybe 300 sq ft, composite if not crazy expensive. Hoping before July. We're in Riverside.";

export const REQUESTER = "Jordan Hale";
export const RECEIVED_DATE = "2026-05-12";
export const REQUEST_SOURCE = "website form";

export const SERVICE_AREA = "Riverside";
export const MINIMUM_SIZE_SQ_FT = "150";
export const OFFERED = "deck replacement (wood or composite); railings";
export const OUT_OF_SCOPE = "roofing; new-home construction";
export const NEVER_IN_DRAFT = "prices; cost bands; markups; supplier names";

export const YOU_PRICE_IT = "You price it. You send it. The kit changes nothing.";
export const DO_NOT_SEND = "Do not send this draft.";

export const FIT_NO_EXAMPLE =
  "A roofing request in Mesa would be FIT NO (out of catalog; outside service area).";
export const NEEDS_CHECK_EXAMPLE =
  "A curved custom deck in Riverside that is not listed as a catalog item would be NEEDS YOUR CHECK, not FIT NO.";

export const CONFIRMED_LINE =
  "work_type = deck replacement. size = maybe 300 sq ft. location = Riverside. timeline stated = hoping before July. material mentioned = composite. requester = Jordan Hale. received = 2026-05-12. source = website form.";

export const AI_INTERPRETATION_TEXT =
  'budget-sensitive because of "if not crazy expensive". "before July" is a requested window, not a booked start date. Existing structure condition is unknown.';

export const RECOMMENDED_ACTION_TEXT =
  "Add the tracker row. Ask the two questions or price the job. You price it. You send it. The kit changes nothing.";

export const QUESTIONS = [
  "What is the condition of the existing deck?",
  "Should the quote include railing replacement?",
] as const;

export const DRAFT_ACKNOWLEDGMENT =
  "Thank you, Jordan. We received your request for a back deck replacement in Riverside, about 300 sq ft, with composite as a preference, and a hope to finish before July. We will review the scope and follow up with questions before we price anything.";

export const RULES_COLUMNS = ["rule", "value"] as const;

export const RULES_ROWS = [
  ["service_area", SERVICE_AREA],
  ["minimum_size_sq_ft", MINIMUM_SIZE_SQ_FT],
  ["offered", OFFERED],
  ["out_of_scope", OUT_OF_SCOPE],
  ["never_in_draft", NEVER_IN_DRAFT],
] as const;

export const TRACKER_COLUMNS = [
  "request_id",
  "received",
  "requester",
  "location",
  "work_type",
  "size_sq_ft",
  "material",
  "timeline",
  "fit",
  "open_questions",
  "status",
] as const;

export type TrackerRow = {
  requestId: string;
  received: string;
  requester: string;
  location: string;
  workType: string;
  sizeSqFt: string;
  material: string;
  timeline: string;
  fit: string;
  openQuestions: string;
  status: string;
};

export const TRACKER_ROW: TrackerRow = {
  requestId: "QR-1001",
  received: RECEIVED_DATE,
  requester: REQUESTER,
  location: SERVICE_AREA,
  workType: "deck replacement",
  sizeSqFt: "300",
  material: "composite",
  timeline: "before July",
  fit: "YES",
  openQuestions: "existing structure; railing included",
  status: "needs pricing",
};

export const TRACKER_CELLS = [
  TRACKER_ROW.requestId,
  TRACKER_ROW.received,
  TRACKER_ROW.requester,
  TRACKER_ROW.location,
  TRACKER_ROW.workType,
  TRACKER_ROW.sizeSqFt,
  TRACKER_ROW.material,
  TRACKER_ROW.timeline,
  TRACKER_ROW.fit,
  TRACKER_ROW.openQuestions,
  TRACKER_ROW.status,
] as const;

export const TRACKER_CSV = [TRACKER_COLUMNS.join(","), TRACKER_CELLS.join(",")].join(
  "\n",
);

export const FACT_CHECK = {
  confirmed: "location = Riverside.",
  rows: [
    { field: "location", confirmed: "Riverside", requestValue: "Riverside" },
    {
      field: "size",
      confirmed: "maybe 300 sq ft",
      requestValue: "maybe 300 sq ft",
    },
    {
      field: "work_type",
      confirmed: "deck replacement",
      requestValue: "back deck redone",
    },
  ],
};

export const MESA_ROOF_REQUEST =
  "Need a new roof on our house in Mesa before August.";

export const SAMPLE_REQUESTS_TEXT = [
  "Fictional request 1 (guided demo)",
  `received: ${RECEIVED_DATE}`,
  `source: ${REQUEST_SOURCE}`,
  `requester: ${REQUESTER}`,
  `request: ${REQUEST_TEXT}`,
  "",
  "Fictional request 2 (FIT NO example)",
  "received: 2026-05-14",
  `source: ${REQUEST_SOURCE}`,
  "requester: Casey Nguyen",
  `request: ${MESA_ROOF_REQUEST}`,
].join("\n");

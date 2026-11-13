import type { UiLocale } from "@/src/lib/i18n/locale";
import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";
import { winbackCopy } from "./copy";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Lapsed Customer Winback Setup Checklist" },
  { id: "skip-rules-prompt", title: "Skip-Rules-First Prompt" },
  { id: "draft-prompt", title: "VIP-First Draft Prompt" },
  { id: "return-check-prompt", title: "Return Check Prompt" },
  { id: "rules-worksheet", title: "Lapse, VIP, and Offer Worksheet" },
  { id: "contact-log-template", title: "Contact Log Template" },
  { id: "action-review-checklist", title: "Send Review Checklist" },
  { id: "sample-customers", title: "Fictional Sample Customer Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write winback rules before any draft: the lapse threshold (last visit before this date counts as lapsed), the VIP visit floor for the last 12 months, whether one-time buyers are skipped, and a written offer list the drafts may not leave. You decide the lapse date, VIP floor, one-time rule, and which offers the business will actually honor.",
  "Export customers with last visit or last order date, last service or item, visit count in the last 12 months, and marketing-consent / do-not-contact flags, then remove emails, phones, and addresses before paste or upload. Also open last period's contact log. You decide which columns to keep. This is an export review, not a live Square, Mindbody, POS, email, or SMS connection.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Skip-Rules-First Prompt and your rules from the Lapse, VIP, and Offer Worksheet, then attach or paste the customer rows and the contact-log names already contacted this period.",
  "AI runs SKIP RULES FIRST. It sets aside rows with no marketing consent, do-not-contact, already contacted this period per the log, last visit more recent than the lapse threshold, and one-time buyers when you chose to skip them. Every skip lists its reason. You decide whether a skipped row should still get a personal note outside this workflow.",
  secondaryPromptSetupStep(
    "VIP-First Draft Prompt",
    "only after skip rules run, to segment VIP vs occasional and draft one message per queued row from the written offer list",
  ),
  "Use the Send Review Checklist, pick the recipient from your own list, and send from your own email or SMS tool, or decide not to. Nothing is sent automatically. The Blueprint never sends, edits, cancels, or pays.",
  secondaryPromptSetupStep(
    "Return Check Prompt",
    "after a later POS export, to mark returned vs still lapsed in the contact log",
  ),
] as const;

export const SKIP_RULES_PROMPT = `You are helping me build a lapsed customer return queue from a pasted customer export and my winback rules. You prepare; I decide.

SKIP RULES FIRST. Apply skip rules before any segment, rank, or draft. Do not draft first and skip later.

Do not invent a discount, private detail, or deadline. Do not send. Nothing is sent automatically.

I am pasting:
1. My winback rules from the Lapse, VIP, and Offer Worksheet (lapse_if_last_visit_before, vip_if_visits_12mo, skip_one_time_buyers, written offer list).
2. A customer export (first, last_visit, last_service, visits_12mo, marketing_consent, do_not_contact).
3. This period's contact log of names already contacted.

RULES
- Write SKIP RULES FIRST at the top.
- Skip any row whose marketing_consent is no or missing. Show the reason marketing_consent is no or marketing_consent missing.
- Skip any row whose do_not_contact is yes. Show the reason do_not_contact is yes.
- Skip any row already contacted this period per the contact log. Show the reason already contacted this period.
- Skip any row whose last_visit is on or after the owner's lapse_if_last_visit_before date. Show the reason and the exact sentence: Do not queue someone whose last visit is after your lapse date.
- If the owner set skip_one_time_buyers, skip any row with visits_12mo equal to 1. Show the reason one-time buyer.
- If a remaining row is missing last_visit, last_service, visits_12mo, or marketing_consent, do not draft it. List it under NEEDS YOUR CHECK.
- Label CONFIRMED (from the export and rules), AI INTERPRETATION, and RECOMMENDED ACTION separately.
- Days since visit do not prove why the person stopped coming. That guess is AI INTERPRETATION, not a CONFIRMED fact.
- The draft is a draft only. Do not invent. Do not send.

OUTPUT FORMAT
SKIP RULES FIRST
QUEUE as of the export as-of date with remaining rows after skips.
SKIPPED: every skipped row with its reason.
AI INTERPRETATION: days since visit do not prove why they stopped.
RECOMMENDED ACTION (you decide): what the person should review. Do not invent. Do not send.

Do not invent. Do not send. You send it. Nothing is sent automatically.`;

export const DRAFT_PROMPT = `You are helping me draft winback messages only after skip rules have run. You prepare; I decide.

Use this prompt only after SKIP RULES FIRST has run and skipped rows are set aside.

Do not invent a discount, private detail, or deadline that is not on the written offer list. Do not send. You send it. Nothing is sent automatically.

I am pasting:
1. My winback rules from the Lapse, VIP, and Offer Worksheet, including the written offer list.
2. The remaining queued rows after skip.

RULES
- Segment remaining rows as VIP when visits_12mo meets the owner's VIP floor; otherwise occasional.
- Rank VIP rows before occasional rows. Within a segment, rank by days since last visit (highest first).
- Draft one message per queued row using only last service or item, last visit date, and an offer from the written offer list for that segment.
- VIP drafts may use only VIP offers. Occasional drafts may use only occasional offers.
- Do not invent. Do not send. You send it.

OUTPUT FORMAT
QUEUE ordered VIP first, then occasional, with CONFIRMED fields and one draft each.
AI INTERPRETATION: days since visit do not prove why they stopped.
RECOMMENDED ACTION (you decide): pick the recipient from your own list and send from your own tool. You send it. Nothing is sent automatically.

Do not invent. Do not send. You send it.`;

export const RETURN_CHECK_PROMPT = `You are helping me check who returned after a later POS export. You prepare; I decide.

Do not invent a return outcome. Do not claim a draft caused a return. Do not send.

I am pasting:
1. The queued names from the prior cycle.
2. A later POS export with first and last_visit.
3. My contact log.

RULES
- Mark queued people RETURNED when last_visit moved after the prior as_of, otherwise still lapsed.
- A return is not proof the message caused it.
- Suggest contact log outcomes; the person records them in the contact log.
- Do not invent return outcomes or claim that a return proves the draft worked.

OUTPUT FORMAT
RETURN CHECK as of the later export date
CONFIRMED: each queued name as RETURNED or still lapsed with the new last_visit.
AI INTERPRETATION: A return is not proof the message caused it.
RECOMMENDED ACTION (you decide): mark returned vs still lapsed in your contact log.

Do not invent. Update the contact log yourself. You send it. Nothing is sent automatically.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "SKIP RULES FIRST ran before any segment, rank, or draft.",
  "Rows without marketing consent were skipped with a visible reason.",
  "do_not_contact rows were skipped with a visible reason.",
  "Each CONFIRMED field matches the export row.",
  "The draft offer appears on the written offer list for that segment.",
  "VIP rows ranked above occasional rows.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "A later return will not be treated as proof the message caused it.",
  "I will pick the recipient from my own list and send from my own email or SMS tool myself. You send it. Nothing is sent automatically.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a customer export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove emails, phones, addresses, and other columns the workflow does not need.",
  "Do not paste phone numbers, email addresses, account passwords, or payment card numbers into the AI tool.",
  "Do not contact someone without marketing consent, and do not contact do-not-contact rows.",
  "Do not invent a discount outside the written offer list.",
  "Do not treat a return as proof the message caused it.",
  "A missing consent column is your risk: without it, skip rules cannot protect opted-out people.",
  "Nothing is sent, edited, cancelled, or paid automatically. You send it. Nothing is sent automatically.",
  "Atlas does not connect to Square, Mindbody, a POS, email, SMS, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const LAPSE_DATE_ERROR = "Enter a lapse threshold date.";
export const VIP_FLOOR_ERROR = "Enter a VIP visit floor of 1 or more.";
export const OFFER_LIST_ERROR =
  "Enter at least one offer on your written offer list.";

export type WinbackRulesInput = {
  lapseBefore: string;
  vipFloor: string;
  skipOneTime: boolean;
  vipOffers: string;
  occasionalOffers: string;
};

export const DEFAULT_RULES_INPUT: WinbackRulesInput = {
  lapseBefore: "2026-04-16",
  vipFloor: "8",
  skipOneTime: true,
  vipOffers: "10% off next color",
  occasionalOffers: "complimentary consult",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parseVipFloor(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

function linesOf(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatOffers(label: string, offers: string[]): string | null {
  if (offers.length === 0) return null;
  return `${label}: ${offers.join("; ")}.`;
}

export function generateWinbackRules(
  input: WinbackRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const errors: string[] = [];
  const lapseBefore = input.lapseBefore.trim();
  const ja = locale === "ja" ? winbackCopy("ja") : null;
  if (!lapseBefore) errors.push(ja?.lapseDateError ?? LAPSE_DATE_ERROR);

  const vipFloor = parseVipFloor(input.vipFloor);
  if (vipFloor === null) errors.push(ja?.vipFloorError ?? VIP_FLOOR_ERROR);

  const vipOffers = linesOf(input.vipOffers);
  const occasionalOffers = linesOf(input.occasionalOffers);
  if (vipOffers.length === 0 && occasionalOffers.length === 0) {
    errors.push(ja?.offerListError ?? OFFER_LIST_ERROR);
  }

  if (errors.length > 0 || vipFloor === null || !lapseBefore) {
    return { ok: false, errors };
  }

  if (ja) {
    return {
      ok: true,
      rules: ja.reviewRules({
        lapseBefore,
        vipFloor,
        skipOneTime: input.skipOneTime,
        vipOffers,
        occasionalOffers,
      }),
    };
  }

  const lines = [
    "Apply SKIP RULES FIRST before any draft.",
    "Skip when marketing_consent is no or missing.",
    "Skip when do_not_contact is yes.",
    "Skip when already contacted this period.",
    `Lapse if last visit before ${lapseBefore}.`,
    `VIP if visits_12mo >= ${vipFloor}.`,
    ...(input.skipOneTime ? ["Skip one-time buyers."] : []),
    ...(formatOffers("VIP offers", vipOffers)
      ? [formatOffers("VIP offers", vipOffers)!]
      : []),
    ...(formatOffers("Occasional offers", occasionalOffers)
      ? [formatOffers("Occasional offers", occasionalOffers)!]
      : []),
    "Do not send. You send it. Nothing is sent automatically.",
  ];

  return { ok: true, rules: lines.join("\n") };
}

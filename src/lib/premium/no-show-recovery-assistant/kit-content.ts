import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "No-show Recovery Setup Checklist" },
  { id: "attendance-prompt", title: "Confirm Attendance Prompt" },
  { id: "rebooking-draft-prompt", title: "Rebooking Draft Prompt" },
  { id: "rules-worksheet", title: "Consent and Repeat Policy Worksheet" },
  { id: "recovery-log-template", title: "Recovery Log Template" },
  { id: "action-review-checklist", title: "Send Review Checklist" },
  { id: "sample-bookings", title: "Fictional Sample Booking Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write recovery rules before any draft: which statuses are never a no-show (default cancelled, plus attended as a hard skip), the repeat no-show threshold including today, and clients who must never get a recovery message. You decide when a miss becomes a policy case, and who is never contacted from this workflow.",
  "Export one day's booking list as CSV with time, client, service, status, contact_pref, sms_consent, and prior_no_shows, plus the open slots that match those services. You decide which columns to keep. Remove phone numbers, email addresses, card numbers, and any columns the workflow does not need. This is an export review, not a live Calendly, Square, Acuity, Google Calendar, or Twilio connection.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Confirm Attendance Prompt and your rules from the Consent and Repeat Policy Worksheet, then attach or paste the booking rows and open slots.",
  "AI runs CONFIRM ATTENDANCE FIRST. It drafts only when status = no_show on the booking row. Attended and cancelled rows are skipped with a visible reason. You decide whether a row marked no_show is actually a no-show before any message is considered.",
  secondaryPromptSetupStep(
    "Rebooking Draft Prompt",
    "after attendance is confirmed, to draft one rebooking message with real open slots",
  ),
  "Use the Send Review Checklist and check every CONFIRMED field against the booking row before contacting anyone. You pick the recipient from your own contacts and send from your own SMS or email tool, or you decide not to. The Blueprint never sends, books, cancels, or charges.",
] as const;

export const ATTENDANCE_PROMPT = `You are helping me confirm attendance from one day's booking export before any recovery draft. You prepare; I decide.

CONFIRM ATTENDANCE FIRST. Draft only when status = no_show on the booking row. Do not draft first and check later.

Do not invent phone numbers, email addresses, deposits, open times, or arrival times. Do not send. Do not book. Do not cancel. Do not charge. Confirm consent before any message.

I am pasting:
1. My recovery rules from the Consent and Repeat Policy Worksheet.
2. One day's booking rows (time, client, service, status, contact_pref, sms_consent, prior_no_shows).
3. Open slots that name the service, weekday or date, and time.

RULES
- Write CONFIRM ATTENDANCE FIRST at the top.
- Draft only when the booking row status is no_show. Show the matching row.
- Skip any row whose status is attended. Show the reason attended. Do not message someone who attended.
- Skip any row whose status is in the owner's never-a-no-show list (default cancelled). Show the reason cancelled; not a no-show.
- If a remaining row is missing time, client, service, or status, or the same client appears twice at the same time, do not draft it. List it under NEEDS YOUR CHECK.
- Label CONFIRMED (from the export), AI INTERPRETATION, and RECOMMENDED ACTION separately.
- A missing arrival time is not proof the client was or was not running late. That guess is AI INTERPRETATION, not a CONFIRMED fact.

OUTPUT FORMAT
CONFIRM ATTENDANCE FIRST
CONFIRMED: each confirmed no-show with time, client, service, status, contact_pref, sms_consent, prior_no_shows from the row.
SKIPPED: attended and cancelled rows with reasons.
SKIPPED FOR SMS: missing sms_consent. NEEDS YOUR CHECK. Confirm consent before any message.
FLAG FOR POLICY: repeat no-shows at the owner's threshold. No recovery draft until the person decides.
AI INTERPRETATION: guesses such as lateness when there is no arrival time. Never present these as facts.
RECOMMENDED ACTION (you decide): what the person should review. Do not send.

Do not invent. Do not send. Confirm consent before any message. You review and send. The kit changes nothing.`;

export const REBOOKING_DRAFT_PROMPT = `You are helping me draft a rebooking message only after attendance is confirmed. You prepare; I decide.

Use this prompt only after CONFIRM ATTENDANCE FIRST has run and the person has confirmed the miss.

Do not invent phone numbers, email addresses, deposits, or open times. Do not send. Do not book. Do not cancel. Do not charge. You review and send. The kit changes nothing.

I am pasting:
1. My recovery rules from the Consent and Repeat Policy Worksheet.
2. The CONFIRMED no-show rows from the Confirm Attendance Prompt.
3. The open slots from the export.

RULES
- SMS draft only when sms_consent = yes and contact_pref = sms. If sms_consent is no or missing, write NEEDS YOUR CHECK with no SMS consent on file. Do not draft SMS.
- Offer only open slots that match the missed service. A time may appear only when it is in the open-slot list and the slot's service matches.
- If no matching open slot exists, write NEEDS YOUR CHECK with no matching open slot. Do not invent a time.
- Flag a client when prior_no_shows plus this miss reaches the owner's repeat threshold. Write FLAG FOR POLICY and do not draft a recovery message until the person decides.
- Open slots are listed as of the export. Do not promise they will still be open when the person sends.
- The draft is a draft only. Do not send it.

OUTPUT FORMAT
DRAFT (SMS, not sent) only for confirmed no-shows with consent and matching open slots.
FLAG FOR POLICY with no draft for repeat no-shows at the threshold.
NEEDS YOUR CHECK for missing consent or no matching open slot.
RECOMMENDED ACTION (you decide): Review the draft. Do not send. You review and send.

Do not invent. Do not send. You review and send. The kit changes nothing.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "CONFIRM ATTENDANCE FIRST ran before any draft.",
  "Attended rows were skipped with a visible reason.",
  "Cancelled rows were skipped and not treated as a no-show.",
  "Each CONFIRMED field matches the booking row.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "SMS is drafted only when sms_consent is yes and contact_pref is sms.",
  "Offered times appear in the open-slot list and match the missed service.",
  "Repeat no-shows at the threshold were flagged instead of auto-drafted.",
  "I will pick the recipient from my own contacts and send from my own SMS or email tool myself. The kit changes nothing.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a booking export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove phone numbers, email addresses, card numbers, and other columns the workflow does not need.",
  "Do not paste phone numbers, email addresses, account passwords, or payment card numbers into the AI tool.",
  "Do not text someone who attended.",
  "Do not send SMS without consent.",
  "Do not offer a slot that is not open or that does not match the service.",
  "Do not auto-message a repeat no-show.",
  "Nothing is sent, booked, cancelled, or paid automatically. You review and send. The kit changes nothing.",
  "Atlas does not connect to Calendly, Square, Acuity, Google Calendar, Twilio, SMS, email, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const THRESHOLD_ERROR = "Enter a repeat no-show threshold of 1 or more.";

export type RecoveryRulesInput = {
  threshold: string;
  neverStatuses: string;
  alwaysSkip: string;
};

export const DEFAULT_RULES_INPUT: RecoveryRulesInput = {
  threshold: "3",
  neverStatuses: "cancelled",
  alwaysSkip: "",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parseThreshold(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

export function generateRecoveryRules(input: RecoveryRulesInput): RulesResult {
  const threshold = parseThreshold(input.threshold);
  if (threshold === null) {
    return { ok: false, errors: [THRESHOLD_ERROR] };
  }

  const neverStatuses = input.neverStatuses
    .split(/\r?\n/)
    .map((status) => status.trim())
    .filter(Boolean);

  const skipClients = input.alwaysSkip
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const lines = [
    "Confirm status = no_show against the booking row before any draft.",
    "Never draft for attended.",
    ...(neverStatuses.length > 0
      ? [`Never treat ${neverStatuses.join("; ")} as a no-show.`]
      : []),
    ...skipClients.map((name) => `Always skip: ${name}`),
    "SMS draft only when sms_consent = yes and contact_pref = sms.",
    "Confirm consent before any message.",
    `Flag when this miss reaches the repeat threshold of ${threshold}.`,
    "Offer only open slots that match the missed service.",
    "Do not send. You review and send. The kit changes nothing.",
  ];

  return { ok: true, rules: lines.join("\n") };
}

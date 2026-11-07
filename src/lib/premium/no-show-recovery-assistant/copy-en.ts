import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";
import type { NoShowCopy } from "./copy-types";

const sampleBookingsCsv = [
  "time,client,service,status,contact_pref,sms_consent,prior_no_shows",
  "10:00,J. Rivera,Cut & color,no_show,sms,yes,0",
  "11:30,A. Chen,Consult,attended,email,no,0",
  "13:00,M. Ortiz,Cut,cancelled,email,no,1",
  "15:00,R. Kim,Color,no_show,email,no,0",
  "16:30,L. Brooks,Cut & color,no_show,sms,yes,2",
  "",
  "service,when",
  "Cut & color,Thu 14:00",
  "Cut & color,Fri 09:30",
  "Consult,Thu 11:00",
].join("\n");

const recoveryLogCsv = [
  "as_of,time,client,service,status,channel,sms_consent,prior_no_shows,slots_offered,action,outcome",
  "2026-10-14,10:00,J. Rivera,Cut & color,no_show,sms,yes,0,Thu 14:00; Fri 09:30,drafted_not_sent,pending_human_approval",
  "2026-10-14,15:00,R. Kim,Color,no_show,email,no,0,,not_drafted,sms_consent_no",
  "2026-10-14,16:30,L. Brooks,Cut & color,no_show,sms,yes,2,,not_drafted,flag_for_policy",
].join("\n");

const planDifferenceNotice =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

const sessionOnlyNotice =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const englishNoShowCopy: NoShowCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "No-show Recovery Assistant",
  publicBody:
    "Confirm who missed the appointment, then draft one rebooking message with real open slots. SMS is drafted only when sms_consent is yes and contact_pref is sms. Email consent does not imply SMS consent. If sms_consent is no or missing, do not draft SMS. You review and send. Nothing is sent automatically.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated on the booking row or in the open-slot list.",
  needsCheckHelp: "A gap you must resolve. sms_consent = no is one of these gaps.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice:
    "The bookings, clients, and open slots on this page are fictional. Nothing here is a real customer, and nothing is sent automatically.",
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The day's bookings",
    "CONFIRM ATTENDANCE FIRST",
    "Draft with real open slots",
    "Check the facts",
    "Repeat no-shows need a policy decision",
    "You review and send",
  ],
  demo: {
    asOfLabel: "As-of date",
    asOfValue: "2026-10-14 (fictional)",
    step1Lead:
      "One fictional day of bookings, plus the open slots that were free in that export. No live calendar is attached. Atlas does not text, email, book, or cancel anyone.",
    bookingsLabel: "Fictional booking export",
    columns: ["time", "client", "service", "status", "contact_pref", "sms_consent", "prior_no_shows"],
    rows: [
      { time: "10:00", client: "J. Rivera", service: "Cut & color", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "0" },
      { time: "11:30", client: "A. Chen", service: "Consult", status: "attended", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "13:00", client: "M. Ortiz", service: "Cut", status: "cancelled", contactPref: "email", smsConsent: "no", prior: "1" },
      { time: "15:00", client: "R. Kim", service: "Color", status: "no_show", contactPref: "email", smsConsent: "no", prior: "0" },
      { time: "16:30", client: "L. Brooks", service: "Cut & color", status: "no_show", contactPref: "sms", smsConsent: "yes", prior: "2" },
    ],
    openSlotsLabel: "Open slots in the export",
    slots: [
      { service: "Cut & color", when: "Thu 14:00" },
      { service: "Cut & color", when: "Fri 09:30" },
      { service: "Consult", when: "Thu 11:00" },
    ],
    consentTeaching:
      "Email consent does not imply SMS consent. A. Chen and R. Kim have contact_pref = email and sms_consent = no, so neither gets an SMS draft.",
    step2Lead:
      "CONFIRM ATTENDANCE FIRST. A row is a no-show only when status = no_show. Attended and cancelled rows are skipped with a reason before any draft.",
    skippedLabel: "Skipped rows",
    skipped: [
      { client: "A. Chen", reason: "attended. Do not message someone who attended." },
      { client: "M. Ortiz", reason: "cancelled; not a no-show." },
    ],
    confirmedLabel: "Confirmed no-shows",
    confirmed: [
      { client: "J. Rivera", detail: "10:00 Cut & color. sms_consent = yes. contact_pref = sms." },
      { client: "R. Kim", detail: "15:00 Color. sms_consent = no. contact_pref = email." },
      { client: "L. Brooks", detail: "16:30 Cut & color. prior_no_shows = 2. This miss reaches 3." },
    ],
    smsHoldLabel: "NEEDS YOUR CHECK",
    smsHold:
      "R. Kim has email on the row and sms_consent = no. Email consent does not imply SMS consent. Do not draft SMS.",
    step3Lead:
      "The Rebooking Draft Prompt runs only after attendance is confirmed. It may offer a time only when that time is in the open-slot list and the slot's service matches.",
    promptName: "Rebooking Draft Prompt",
    draftLabel: "DRAFT (SMS, not sent)",
    draftText: "Hi J., we missed you today. Would Thu 14:00 or Fri 09:30 work for Cut & color?",
    step3Needs:
      "R. Kim stays under NEEDS YOUR CHECK. sms_consent = no, so there is no SMS draft. Email consent does not imply SMS consent.",
    step3Policy: "L. Brooks is not drafted here. This miss reaches the repeat threshold, so it waits for a policy decision.",
    step3Boundary: "Nothing is sent automatically. You review and send.",
    step4Lead:
      "Open the J. Rivera row. Before anyone is contacted, every CONFIRMED field is checked against the booking row.",
    factButton: "Check facts against the booking row",
    factTableLabel: "Fact check for J. Rivera",
    factColumns: ["Field", "In the CONFIRMED line", "In the booking row", "Result"],
    factRows: [
      { field: "status", confirmed: "no_show", booking: "no_show" },
      { field: "sms_consent", confirmed: "yes", booking: "yes" },
      { field: "contact_pref", confirmed: "sms", booking: "sms" },
      { field: "service", confirmed: "Cut & color", booking: "Cut & color" },
    ],
    factResult: "Matches",
    step5Lead:
      "L. Brooks already has prior_no_shows = 2. Counting today, this miss reaches the repeat threshold of 3.",
    policyLabel: "FLAG FOR POLICY",
    policyDetail:
      "No recovery draft until a person decides. Do not auto-message a repeat no-show. Nothing is sent automatically.",
    step5Boundary: "You decide whether a policy exception, a deposit, or no message is right. The kit does not send.",
    step6TitleSentence: "You review and send. Nothing is sent automatically.",
    step6Body:
      "You pick the recipient from your own contacts and send from your own SMS or email tool, or you decide not to. The Blueprint never sends, books, cancels, or charges.",
    step6Boundary:
      "A person approves every message before it goes out. The kit changes nothing.",
    kitLink: "Open the Premium kit (sign-in is required, private preview)",
  },
  kitEyebrow: "Premium · Private preview",
  kitTitle: "No-show Recovery Assistant Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing one day's booking export in ChatGPT, Claude, or Gemini. AI labels confirmed misses and drafts only after attendance, consent, and matching open slots. You review and send yourself. Nothing is sent automatically. The kit changes nothing.",
  planDifferenceNotice,
  sessionOnlyNotice,
  kitNavLabel: "Kit contents",
  inThisKit: "In this kit",
  backToDemo: "Back to the guided demo",
  lockedEyebrow: "Premium · Private preview",
  lockedTitle: "Premium is locked",
  lockedBody:
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. You review and send. Nothing is sent automatically. The kit changes nothing.",
  sections: [
    {
      id: "setup-checklist",
      title: "No-show Recovery Setup Checklist",
      intro:
        "Run these steps before you paste a real export. The second prompt is named the Rebooking Draft Prompt. Paste it only after attendance is confirmed. Practice first with the fictional sample.",
    },
    {
      id: "attendance-prompt",
      title: "Confirm Attendance Prompt",
      intro:
        "Paste this prompt with your rules, then the booking rows and open slots. It confirms attendance before any rebooking draft. If sms_consent is no or missing, it does not draft SMS. Email consent does not imply SMS consent.",
    },
    {
      id: "rebooking-draft-prompt",
      title: "Rebooking Draft Prompt",
      intro:
        "This is the Rebooking Draft Prompt. Use it only after the Confirm Attendance Prompt, and only after you have confirmed the miss. It drafts one message with real open slots. Nothing is sent automatically.",
    },
    {
      id: "rules-worksheet",
      title: "Consent and Repeat Policy Worksheet",
      intro:
        "Set the repeat threshold, the statuses that are never a no-show, and anyone who must never get a recovery message. Nothing you enter here is saved to Atlas.",
    },
    {
      id: "recovery-log-template",
      title: "Recovery Log Template",
      intro:
        "Start your own spreadsheet with these columns. Only you record what you sent, or that you sent nothing. Copy CSV includes the fictional J. Rivera row so you can see a draft that was not sent. Nothing is sent automatically.",
    },
    {
      id: "action-review-checklist",
      title: "Send Review Checklist",
      intro:
        "Use this before you contact anyone. Progress stays in this browser session only. A person approves every message. Nothing is sent automatically.",
    },
    {
      id: "sample-bookings",
      title: "Fictional Sample Booking Export",
      intro:
        "The same fictional day used in the guided demo, as of 2026-10-14. R. Kim has email on the row and sms_consent = no. Email consent does not imply SMS consent. Paste this with the prompts before you use real names.",
    },
    {
      id: "safety-guidance",
      title: "Data and Safety Guidance",
      intro:
        "Read this before you paste or upload a booking export. You review and send. Nothing is sent automatically.",
    },
  ],
  setupSteps: [
    "Write recovery rules before any draft: which statuses are never a no-show (default cancelled, plus attended as a hard skip), the repeat no-show threshold including today, and clients who must never get a recovery message. You decide when a miss becomes a policy case, and who is never contacted from this workflow.",
    "Export one day's booking list as CSV with time, client, service, status, contact_pref, sms_consent, and prior_no_shows, plus the open slots that match those services. You decide which columns to keep. Remove phone numbers, email addresses, card numbers, and any columns the workflow does not need. This is an export review, not a live Calendly, Square, Acuity, Google Calendar, or Twilio connection.",
    "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
    "Paste the Confirm Attendance Prompt and your rules from the Consent and Repeat Policy Worksheet, then attach or paste the booking rows and open slots.",
    "AI runs CONFIRM ATTENDANCE FIRST. It drafts only when status = no_show on the booking row. Attended and cancelled rows are skipped with a visible reason. You decide whether a row marked no_show is actually a no-show before any message is considered. If sms_consent is no or missing, do not draft SMS. Email consent does not imply SMS consent.",
    secondaryPromptSetupStep(
      "Rebooking Draft Prompt",
      "after attendance is confirmed, to draft one rebooking message with real open slots",
    ),
    "Use the Send Review Checklist and check every CONFIRMED field against the booking row before contacting anyone. You pick the recipient from your own contacts and send from your own SMS or email tool, or you decide not to. Nothing is sent automatically. The Blueprint never sends, books, cancels, or charges.",
  ],
  attendancePrompt: `You are helping me confirm attendance from one day's booking export before any recovery draft. You prepare; I decide.

CONFIRM ATTENDANCE FIRST. Draft only when status = no_show on the booking row. Do not draft first and check later.

Do not invent phone numbers, email addresses, deposits, open times, or arrival times. Do not send. Do not book. Do not cancel. Do not charge. Confirm consent before any message. Nothing is sent automatically.

I am pasting:
1. My recovery rules from the Consent and Repeat Policy Worksheet.
2. One day's booking rows (time, client, service, status, contact_pref, sms_consent, prior_no_shows).
3. Open slots that name the service, weekday or date, and time.

RULES
- Write CONFIRM ATTENDANCE FIRST at the top.
- Draft only when the booking row status is no_show. Show the matching row.
- Skip any row whose status is attended. Show the reason attended. Do not message someone who attended.
- Skip any row whose status is in the owner's never-a-no-show list (default cancelled). Show the reason cancelled; not a no-show.
- If sms_consent is no or missing, do not draft SMS. Email consent does not imply SMS consent. Write NEEDS YOUR CHECK.
- If a remaining row is missing time, client, service, or status, or the same client appears twice at the same time, do not draft it. List it under NEEDS YOUR CHECK.
- Label CONFIRMED (from the export), AI INTERPRETATION, and RECOMMENDED ACTION separately.
- A missing arrival time is not proof the client was or was not running late. That guess is AI INTERPRETATION, not a CONFIRMED fact.

OUTPUT FORMAT
CONFIRM ATTENDANCE FIRST
CONFIRMED: each confirmed no-show with time, client, service, status, contact_pref, sms_consent, prior_no_shows from the row.
SKIPPED: attended and cancelled rows with reasons.
SKIPPED FOR SMS: sms_consent is no or missing. NEEDS YOUR CHECK. Do not draft SMS. Email consent does not imply SMS consent. Confirm consent before any message.
FLAG FOR POLICY: repeat no-shows at the owner's threshold. No recovery draft until the person decides.
AI INTERPRETATION: guesses such as lateness when there is no arrival time. Never present these as facts.
RECOMMENDED ACTION (you decide): what the person should review. Do not send. Nothing is sent automatically.

Do not invent. Do not send. Confirm consent before any message. You review and send. The kit changes nothing.`,
  rebookingDraftPrompt: `You are helping me draft a rebooking message only after attendance is confirmed. You prepare; I decide.

Use this prompt only after CONFIRM ATTENDANCE FIRST has run and the person has confirmed the miss. This prompt is the Rebooking Draft Prompt.

Do not invent phone numbers, email addresses, deposits, or open times. Do not send. Do not book. Do not cancel. Do not charge. You review and send. Nothing is sent automatically. The kit changes nothing.

I am pasting:
1. My recovery rules from the Consent and Repeat Policy Worksheet.
2. The CONFIRMED no-show rows from the Confirm Attendance Prompt.
3. The open slots from the export.

RULES
- SMS draft only when sms_consent = yes and contact_pref = sms. If sms_consent is no or missing, write NEEDS YOUR CHECK with no SMS consent on file. Do not draft SMS.
- Email consent does not imply SMS consent. contact_pref = email, or an email address on file, is not SMS consent.
- Offer only open slots that match the missed service. A time may appear only when it is in the open-slot list and the slot's service matches.
- If no matching open slot exists, write NEEDS YOUR CHECK with no matching open slot. Do not invent a time.
- Flag a client when prior_no_shows plus this miss reaches the owner's repeat threshold. Write FLAG FOR POLICY and do not draft a recovery message until the person decides.
- Open slots are listed as of the export. Do not promise they will still be open when the person sends.
- The draft is a draft only. Do not send it.

OUTPUT FORMAT
DRAFT (SMS, not sent) only for confirmed no-shows with sms_consent = yes, contact_pref = sms, and matching open slots.
FLAG FOR POLICY with no draft for repeat no-shows at the threshold.
NEEDS YOUR CHECK for sms_consent = no, missing sms_consent, or no matching open slot. Email consent does not imply SMS consent.
RECOMMENDED ACTION (you decide): Review the draft. Do not send. You review and send. Nothing is sent automatically.

Do not invent. Do not send. You review and send. The kit changes nothing.`,
  copyPrompt: "Copy Prompt",
  copied: "Copied",
  copyFailed: "Could not copy automatically. Select the text above and copy it manually.",
  consentHelper:
    "Email consent does not imply SMS consent. If sms_consent is no or missing, the rules say not to draft SMS.",
  thresholdLabel: "Repeat no-show threshold including today",
  neverStatusesLabel: "Statuses that are never a no-show (one per line)",
  alwaysSkipLabel: "Clients to always skip (one per line)",
  generateRules: "Generate My Recovery Rules",
  inputsChanged: "Inputs changed. Generate again before you copy the rules.",
  rulesHeading: "Your recovery rules",
  copyRules: "Copy rules",
  thresholdError: "Enter a repeat no-show threshold of 1 or more.",
  recoveryRules: ({ threshold, neverStatuses, skipClients }) => {
    const lines = [
      "Confirm status = no_show against the booking row before any draft.",
      "Never draft for attended.",
      ...(neverStatuses.length > 0 ? [`Never treat ${neverStatuses.join("; ")} as a no-show.`] : []),
      ...skipClients.map((name) => `Always skip: ${name}`),
      "SMS draft only when sms_consent = yes and contact_pref = sms.",
      "If sms_consent is no or missing, do not draft SMS.",
      "Email consent does not imply SMS consent.",
      "Confirm consent before any message.",
      `Flag when this miss reaches the repeat threshold of ${threshold}.`,
      "Offer only open slots that match the missed service.",
      "Nothing is sent automatically.",
      "Do not send. You review and send. The kit changes nothing.",
    ];
    return lines.join("\n");
  },
  reviewItems: [
    "CONFIRM ATTENDANCE FIRST ran before any draft.",
    "Attended rows were skipped with a visible reason.",
    "Cancelled rows were skipped and not treated as a no-show.",
    "Each CONFIRMED field matches the booking row.",
    "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
    "SMS is drafted only when sms_consent is yes and contact_pref is sms. If sms_consent is no or missing, do not draft SMS. Email consent does not imply SMS consent.",
    "Offered times appear in the open-slot list and match the missed service.",
    "Repeat no-shows at the threshold were flagged instead of auto-drafted.",
    "I will pick the recipient from my own contacts and send from my own SMS or email tool myself. Nothing is sent automatically. The kit changes nothing.",
  ],
  checkedLabel: (done, total) => `Checked ${done} of ${total}`,
  resetChecklist: "Reset checklist",
  reviewComplete:
    "Review complete for this run. Reset the checklist before the next one. You still choose whether any message is sent. Nothing is sent automatically.",
  allowedOutcomesLabel: "Allowed outcomes",
  allowedOutcomes: ["drafted_not_sent", "sent_by_person", "not_drafted", "skipped"],
  fictionalExample: "Fictional example rows",
  fictionalBadge: "Fictional",
  copyCsv: "Copy CSV",
  sampleTableLabel: "Fictional sample booking export",
  logTableLabel: "Recovery log template with fictional example rows",
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
    "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a booking export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
    "Remove phone numbers, email addresses, card numbers, and other columns the workflow does not need.",
    "Do not paste phone numbers, email addresses, account passwords, or payment card numbers into the AI tool.",
    "Do not text someone who attended.",
    "Do not send SMS without consent. sms_consent = no and a missing sms_consent both mean do not draft SMS.",
    "Email consent does not imply SMS consent.",
    "Do not offer a slot that is not open or that does not match the service.",
    "Do not auto-message a repeat no-show.",
    "Nothing is sent automatically. Nothing is booked, cancelled, or paid automatically. You review and send. A person approves every message before it goes out. The kit changes nothing.",
    "Atlas does not connect to Calendly, Square, Acuity, Google Calendar, Twilio, SMS, email, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
    sessionOnlyNotice,
  ],
  sampleBookingsCsv,
  recoveryLogCsv,
};

export const DEMO_PATH = "/blueprints/no-show-recovery-assistant";
export const KIT_PATH = "/blueprints/no-show-recovery-assistant/kit";

export const FICTIONAL_DATA_NOTICE =
  "All bookings, names, times, services, and dates on this page are fictional. No real client data is used, and nothing is connected to a calendar, SMS tool, Calendly, Square, Acuity, Twilio, or any other live system.";

export const AS_OF = "2026-10-14";
export const REPEAT_NO_SHOW_THRESHOLD = "3";

export const YOU_REVIEW_AND_SEND =
  "You review and send. The kit changes nothing.";
export const DO_NOT_SEND = "Do not send this draft.";
export const DO_NOT_MESSAGE_ATTENDED = "Do not message someone who attended.";
export const CONFIRM_CONSENT = "Confirm consent before any message.";
export const THIRD_NO_SHOW_POLICY =
  "A third no-show is a policy decision, not an automatic text.";
export const NO_DEPOSIT = "No deposit is charged from this kit.";
export const SERVICE_DOES_NOT_MATCH =
  "Thu 11:00 Consult is not offered because the service does not match.";

export const DRAFT_SMS =
  "Hi J., we missed you today. Would Thu 2:00 or Fri 9:30 work instead?";

export const BOOKING_COLUMNS = [
  "time",
  "client",
  "service",
  "status",
  "contact_pref",
  "sms_consent",
  "prior_no_shows",
] as const;

export type BookingRow = {
  time: string;
  client: string;
  service: string;
  status: string;
  contactPref: string;
  smsConsent: string;
  priorNoShows: string;
};

export const BOOKING_ROWS: BookingRow[] = [
  {
    time: "10:00",
    client: "J. Rivera",
    service: "Cut & color",
    status: "no_show",
    contactPref: "sms",
    smsConsent: "yes",
    priorNoShows: "0",
  },
  {
    time: "11:30",
    client: "A. Chen",
    service: "Consult",
    status: "attended",
    contactPref: "email",
    smsConsent: "no",
    priorNoShows: "0",
  },
  {
    time: "13:00",
    client: "M. Okonkwo",
    service: "Highlights",
    status: "no_show",
    contactPref: "sms",
    smsConsent: "no",
    priorNoShows: "0",
  },
  {
    time: "14:30",
    client: "S. Patel",
    service: "Cut",
    status: "cancelled",
    contactPref: "sms",
    smsConsent: "yes",
    priorNoShows: "0",
  },
  {
    time: "16:00",
    client: "R. Kim",
    service: "Color",
    status: "no_show",
    contactPref: "sms",
    smsConsent: "yes",
    priorNoShows: "2",
  },
];

export function bookingCells(row: BookingRow): string[] {
  return [
    row.time,
    row.client,
    row.service,
    row.status,
    row.contactPref,
    row.smsConsent,
    row.priorNoShows,
  ];
}

export const SAMPLE_BOOKINGS_CSV = [
  BOOKING_COLUMNS.join(","),
  ...BOOKING_ROWS.map((row) => bookingCells(row).join(",")),
].join("\n");

export const OPEN_SLOT_COLUMNS = ["date", "weekday", "time", "service"] as const;

export type OpenSlot = {
  date: string;
  weekday: string;
  timeDisplay: string;
  service: string;
};

export const OPEN_SLOTS: OpenSlot[] = [
  {
    date: "2026-10-15",
    weekday: "Thu",
    timeDisplay: "2:00 (14:00)",
    service: "Cut & color",
  },
  {
    date: "2026-10-16",
    weekday: "Fri",
    timeDisplay: "9:30",
    service: "Cut & color",
  },
  {
    date: "2026-10-15",
    weekday: "Thu",
    timeDisplay: "11:00",
    service: "Consult",
  },
  {
    date: "2026-10-16",
    weekday: "Fri",
    timeDisplay: "15:00",
    service: "Color",
  },
];

export function openSlotCells(slot: OpenSlot): string[] {
  return [slot.date, slot.weekday, slot.timeDisplay, slot.service];
}

export const CONFIRMED_RIVERA =
  "J. Rivera missed 10:00 Cut & color on 2026-10-14. status = no_show. contact_pref = sms. sms_consent = yes. prior_no_shows = 0.";

export const CONFIRMED_OPEN_SLOTS =
  "CONFIRMED open Cut & color slots: Thu 2:00 (2026-10-15 14:00), Fri 9:30 (2026-10-16 09:30).";

export const SKIPPED_CHEN = `A. Chen (attended; ${DO_NOT_MESSAGE_ATTENDED}).`;
export const SKIPPED_PATEL = "S. Patel (cancelled; not a no-show).";
export const SKIPPED_OKONKWO =
  "M. Okonkwo (sms_consent = no). NEEDS YOUR CHECK: no SMS consent on file. Confirm consent before any message. Do not send SMS.";
export const FLAGGED_KIM =
  "R. Kim (prior_no_shows = 2; this miss is number 3). No recovery draft until you decide.";

export const NOT_OFFERED =
  "NOT OFFERED: Thu 11:00 Consult (service does not match Cut & color). Fri 15:00 Color (service does not match Cut & color).";

export const AI_INTERPRETATION_TEXT =
  "Whether J. Rivera was running late is unknown; the export has no arrival time. Thu 2:00 and Fri 9:30 are listed as open as of this export, not a promise they remain open when you send.";

export const RECOMMENDED_ACTION_TEXT = `Review the J. Rivera draft. ${YOU_REVIEW_AND_SEND} ${DO_NOT_SEND}`;

export const FACT_CHECK = {
  confirmed: CONFIRMED_RIVERA,
  rows: [
    { field: "status", confirmed: "no_show", bookingValue: "no_show" },
    { field: "sms_consent", confirmed: "yes", bookingValue: "yes" },
    {
      field: "open slots",
      confirmed: "Thu 2:00 and Fri 9:30",
      bookingValue: "Thu 2:00 Cut & color and Fri 9:30 Cut & color",
    },
  ],
};

export const RECOVERY_LOG_COLUMNS = [
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
] as const;

export type RecoveryLogRow = {
  asOf: string;
  time: string;
  client: string;
  service: string;
  status: string;
  channel: string;
  smsConsent: string;
  priorNoShows: string;
  slotsOffered: string;
  action: string;
  outcome: string;
};

export const RECOVERY_LOG_ROWS: RecoveryLogRow[] = [
  {
    asOf: AS_OF,
    time: "10:00",
    client: "J. Rivera",
    service: "Cut & color",
    status: "no_show",
    channel: "sms",
    smsConsent: "yes",
    priorNoShows: "0",
    slotsOffered: "Thu 2:00; Fri 9:30",
    action: "drafted_not_sent",
    outcome: "left_empty",
  },
  {
    asOf: AS_OF,
    time: "11:30",
    client: "A. Chen",
    service: "Consult",
    status: "attended",
    channel: "email",
    smsConsent: "no",
    priorNoShows: "0",
    slotsOffered: "",
    action: "skipped_attended",
    outcome: "left_empty",
  },
  {
    asOf: AS_OF,
    time: "13:00",
    client: "M. Okonkwo",
    service: "Highlights",
    status: "no_show",
    channel: "sms",
    smsConsent: "no",
    priorNoShows: "0",
    slotsOffered: "",
    action: "skipped_no_consent",
    outcome: "left_empty",
  },
  {
    asOf: AS_OF,
    time: "14:30",
    client: "S. Patel",
    service: "Cut",
    status: "cancelled",
    channel: "sms",
    smsConsent: "yes",
    priorNoShows: "0",
    slotsOffered: "",
    action: "skipped_cancelled",
    outcome: "left_empty",
  },
  {
    asOf: AS_OF,
    time: "16:00",
    client: "R. Kim",
    service: "Color",
    status: "no_show",
    channel: "sms",
    smsConsent: "yes",
    priorNoShows: "2",
    slotsOffered: "",
    action: "flagged_policy",
    outcome: "policy_hold",
  },
];

export function recoveryLogCells(row: RecoveryLogRow): string[] {
  return [
    row.asOf,
    row.time,
    row.client,
    row.service,
    row.status,
    row.channel,
    row.smsConsent,
    row.priorNoShows,
    row.slotsOffered,
    row.action,
    row.outcome,
  ];
}

export const RECOVERY_LOG_CSV = [
  RECOVERY_LOG_COLUMNS.join(","),
  ...RECOVERY_LOG_ROWS.map((row) => recoveryLogCells(row).join(",")),
].join("\n");

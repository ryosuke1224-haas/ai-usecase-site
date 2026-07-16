export type IndustryProfile = {
  slug: string;
  name: string;
  summary: string;
  dataYouLikelyHave: string[];
  apisYouLikelyUse: string[];
  starterWorkflows: string[];
};

export const industryProfiles: IndustryProfile[] = [
  {
    slug: "fitness-studio",
    name: "Fitness Studio",
    summary:
      "Gyms, yoga studios, CrossFit boxes, and personal training businesses with class bookings, memberships, and repeat clients.",
    dataYouLikelyHave: [
      "booking-data",
      "calendar-events",
      "customer-list",
      "pos-transactions",
      "emails",
      "customer-reviews",
    ],
    apisYouLikelyUse: [
      "calendly-api",
      "google-calendar-api",
      "square-api",
      "gmail-api",
      "google-business-profile-api",
      "twilio-api",
    ],
    starterWorkflows: [
      "no-show-recovery-assistant",
      "ai-booking-optimizer",
      "inactive-customer-winback",
      "ai-review-response-assistant",
    ],
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    summary:
      "Sit-down, fast casual, and catering businesses with POS sales, reservations, and local reputation management needs.",
    dataYouLikelyHave: [
      "pos-transactions",
      "customer-reviews",
      "booking-data",
      "customer-list",
      "emails",
      "social-media-comments",
    ],
    apisYouLikelyUse: [
      "square-api",
      "google-business-profile-api",
      "yelp-fusion-api",
      "gmail-api",
      "twilio-api",
    ],
    starterWorkflows: [
      "ai-review-intelligence",
      "ai-review-response-assistant",
      "inactive-customer-winback",
      "local-seo-content-assistant",
    ],
  },
  {
    slug: "home-services",
    name: "Home Services",
    summary:
      "Plumbers, electricians, cleaners, and landscapers quoting jobs, scheduling visits, and managing field crews.",
    dataYouLikelyHave: [
      "website-form-submissions",
      "emails",
      "calendar-events",
      "crm-records",
      "call-transcripts",
      "customer-reviews",
    ],
    apisYouLikelyUse: [
      "gmail-api",
      "google-calendar-api",
      "google-sheets-api",
      "hubspot-api",
      "twilio-api",
    ],
    starterWorkflows: [
      "quote-request-assistant",
      "ai-follow-up-engine",
      "ai-meeting-prep-assistant",
      "local-seo-content-assistant",
    ],
  },
  {
    slug: "salon-spa",
    name: "Salon & Spa",
    summary:
      "Appointment-heavy businesses with repeat clients, no-shows, and review-driven local marketing.",
    dataYouLikelyHave: [
      "booking-data",
      "calendar-events",
      "customer-list",
      "customer-reviews",
      "pos-transactions",
      "emails",
    ],
    apisYouLikelyUse: [
      "calendly-api",
      "square-api",
      "google-business-profile-api",
      "gmail-api",
      "twilio-api",
    ],
    starterWorkflows: [
      "no-show-recovery-assistant",
      "ai-booking-optimizer",
      "ai-review-response-assistant",
      "inactive-customer-winback",
    ],
  },
  {
    slug: "consulting-agency",
    name: "Consulting & Agency",
    summary:
      "Knowledge workers selling projects, managing client inboxes, and running on email plus calendar.",
    dataYouLikelyHave: [
      "emails",
      "calendar-events",
      "crm-records",
      "call-transcripts",
      "documents-and-pdfs",
      "spreadsheets",
    ],
    apisYouLikelyUse: [
      "gmail-api",
      "google-calendar-api",
      "hubspot-api",
      "notion-api",
      "openai-api",
    ],
    starterWorkflows: [
      "ai-daily-inbox-briefing",
      "ai-meeting-prep-assistant",
      "ai-follow-up-engine",
      "quote-request-assistant",
    ],
  },
  {
    slug: "retail-shop",
    name: "Retail Shop",
    summary:
      "Brick-and-mortar or hybrid retail with POS data, loyalty customers, and seasonal marketing needs.",
    dataYouLikelyHave: [
      "pos-transactions",
      "customer-list",
      "customer-reviews",
      "emails",
      "social-media-comments",
    ],
    apisYouLikelyUse: [
      "square-api",
      "gmail-api",
      "google-business-profile-api",
      "twilio-api",
    ],
    starterWorkflows: [
      "inactive-customer-winback",
      "ai-review-intelligence",
      "ai-content-calendar",
    ],
  },
];

export function getIndustryProfile(slug: string): IndustryProfile | undefined {
  return industryProfiles.find((p) => p.slug === slug);
}

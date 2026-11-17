/**
 * Source of truth for the private operations dashboard at /admin/project.
 * Update this file after implementation work that changes project status,
 * the roadmap, the backlog, or recent changes. The dashboard reads this
 * module directly. Do not keep a second copy of these lists in the UI.
 */

export const PROJECT_STATUSES = ["LIVE", "IN_PROGRESS", "PLANNED", "BACKLOG", "IDEA"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectArea = {
  id: string;
  name: string;
  status: ProjectStatus;
  note: string;
  priority?: "high" | "medium" | "low";
  nextAction?: string;
};

export type RoadmapItem = {
  id: string;
  name: string;
  note: string;
};

export type RecentChange = {
  date: string;
  title: string;
  summary: string;
  kind?: "feature" | "product" | "content" | "operations";
};

export type ProjectOperations = {
  updated: string;
  areas: ProjectArea[];
  roadmap: {
    now: RoadmapItem[];
    next: RoadmapItem[];
    later: RoadmapItem[];
  };
  recentChanges: RecentChange[];
};

export const projectOperations: ProjectOperations = {
  updated: "2026-11-16",
  areas: [
    {
      id: "japanese-site",
      name: "Japanese site",
      status: "LIVE",
      note: "Public Japanese pages are served under /ja.",
    },
    {
      id: "english-site",
      name: "English site",
      status: "LIVE",
      note: "Public English pages use the unprefixed routes.",
    },
    {
      id: "stripe-live-checkout",
      name: "Stripe live checkout",
      status: "LIVE",
      note: "Hosted Checkout is in the app. Production totals count paid live-mode sessions only.",
    },
    {
      id: "auth",
      name: "Auth",
      status: "LIVE",
      note: "Supabase email sign-in protects My Blueprints and paid kits.",
    },
    {
      id: "my-blueprints",
      name: "My Blueprints",
      status: "LIVE",
      note: "Signed-in library of free and owned kits.",
    },
    {
      id: "premium-blueprints",
      name: "Premium Blueprints",
      status: "LIVE",
      note: "Paid kits stay closed until an entitlement is recorded.",
    },
    {
      id: "collections",
      name: "Collections",
      status: "LIVE",
      note: "AI Collections Assistant has a public page and checkout.",
    },
    {
      id: "daily-inbox",
      name: "Daily Inbox",
      status: "LIVE",
      note: "Free starter kit for signed-in users.",
    },
    {
      id: "operations-dashboard",
      name: "Operations Dashboard",
      status: "LIVE",
      note: "Private /admin/project is live for allowlisted owners. It does not publish, send, or change checkout.",
    },
    {
      id: "vercel-analytics",
      name: "Vercel Analytics",
      status: "LIVE",
      note: "Web Analytics tracking is live on production. /admin is excluded. The dashboard reads visitors and page views when the server token is set.",
    },
    {
      id: "blog",
      name: "Blog foundation",
      status: "LIVE",
      note: "Japanese /ja/blog and article pages are live. Only PUBLISHED rows are public. Article storage is applied.",
    },
    {
      id: "newsletter-signup",
      name: "Newsletter signup",
      status: "LIVE",
      note: "Signup and storage are live on the Japanese homepage, blog, articles, and /ja/newsletter. Mail is not sent.",
    },
    {
      id: "newsletter-sending",
      name: "Newsletter sending",
      status: "PLANNED",
      note: "Sending is not built. No issue is delivered from the dashboard.",
      priority: "medium",
      nextAction: "Keep send disconnected until controlled sending exists.",
    },
    {
      id: "atlas-weekly",
      name: "Atlas weekly",
      status: "PLANNED",
      note: "Weekly automation is not built.",
      priority: "high",
      nextAction: "Research news, generate drafts, and insert them into the Review Queue.",
    },
    {
      id: "news-research",
      name: "News research automation",
      status: "PLANNED",
      note: "Collecting source material for Japanese blog and newsletter drafts is not built.",
      priority: "high",
      nextAction: "Feed researched items into draft generation.",
    },
    {
      id: "draft-generation",
      name: "Blog and newsletter draft generation",
      status: "PLANNED",
      note: "Automatic draft generation is not built. Drafts are not published or sent.",
      priority: "high",
      nextAction: "Insert generated drafts into the Review Queue.",
    },
    {
      id: "controlled-publish",
      name: "Controlled publish",
      status: "PLANNED",
      note: "An explicit owner action to publish an approved article or issue is not built.",
      priority: "medium",
      nextAction: "Keep publish separate from review decisions.",
    },
    {
      id: "scheduling",
      name: "Scheduling",
      status: "PLANNED",
      note: "Choosing when an approved item is published or sent is not built.",
      priority: "medium",
      nextAction: "Add scheduling after controlled publish and sending exist.",
    },
    {
      id: "analytics-read",
      name: "Analytics dashboard API",
      status: "LIVE",
      note: "The dashboard reads Vercel Web Analytics for the selected range when VERCEL_WEB_ANALYTICS_TOKEN is set on the server. Without that token, the counts stay Not available. /admin traffic is excluded.",
    },
    {
      id: "review-queue",
      name: "Review queue",
      status: "LIVE",
      note: "The Review Queue is live. Approve, needs changes, and reject are stored and do not publish or send. Local Atlas memory stays read-only.",
    },
    {
      id: "cs-automation",
      name: "CS automation",
      status: "PLANNED",
      note: "Customer-support automation is not built.",
      priority: "low",
      nextAction: "Leave customer-support drafts for a later phase.",
    },
    {
      id: "sns-automation",
      name: "SNS automation",
      status: "PLANNED",
      note: "Social posting automation is not built.",
      priority: "low",
      nextAction: "Leave social drafts for a later phase.",
    },
    {
      id: "product-automation",
      name: "Broader product automation",
      status: "PLANNED",
      note: "Automation beyond content drafts is not built.",
      priority: "low",
      nextAction: "Leave product automation until weekly content drafts are running.",
    },
  ],
  roadmap: {
    now: [
      {
        id: "atlas-weekly-automation",
        name: "Atlas Weekly Automation",
        note: "Research, draft blog and newsletter items, generate Blueprint candidates, run QA, and insert the results into the Review Queue. The weekly run is not built.",
      },
      {
        id: "news-research",
        name: "News research automation",
        note: "Collect source material for Japanese blog and newsletter drafts. Not built.",
      },
      {
        id: "draft-generation",
        name: "Blog/newsletter draft generation",
        note: "Create drafts for the Review Queue. Not built. Nothing is published or sent automatically.",
      },
    ],
    next: [
      {
        id: "controlled-publish",
        name: "Controlled Publish",
        note: "Publish an approved article or issue only from an explicit owner action. Not built.",
      },
      {
        id: "newsletter-sending",
        name: "Newsletter sending",
        note: "Deliver an approved issue to active subscribers. Not built.",
      },
      {
        id: "scheduling",
        name: "Scheduling",
        note: "Choose when an approved item is published or sent. Not built.",
      },
    ],
    later: [
      {
        id: "sns-automation",
        name: "SNS automation",
        note: "Draft social posts from an approved issue. Not built.",
      },
      {
        id: "cs-automation",
        name: "CS automation",
        note: "Draft support replies for a person to send. Not built.",
      },
      {
        id: "product-automation",
        name: "Broader product automation",
        note: "Extend weekly automation beyond content drafts. Not built.",
      },
    ],
  },
  recentChanges: [
    {
      date: "2026-11-16",
      kind: "operations",
      title: "Analytics dashboard API",
      summary:
        "The admin dashboard can read Vercel Web Analytics visitors, page views, product page views, top pages, and referrers. The server token stays off the browser. Missing or failed reads stay Not available.",
    },
    {
      date: "2026-11-14",
      kind: "operations",
      title: "Production growth and admin status",
      summary:
        "The operations dashboard, Vercel Analytics tracking, Japanese blog, newsletter signup storage, and Review Queue are live. Article and newsletter storage is applied. Sending, weekly automation, draft generation, and controlled publish are not built.",
    },
    {
      date: "2026-11-13",
      kind: "operations",
      title: "Admin review queue",
      summary:
        "Split /admin/project into operating sections. Approve, needs changes, and reject update article, newsletter issue, and review-item status. Nothing is published or sent from those actions. Local Atlas runs stay read-only.",
    },
    {
      date: "2026-11-13",
      kind: "content",
      title: "Analytics, Japanese blog, and newsletter signup",
      summary:
        "Added Vercel Web Analytics in the root layout, with /admin excluded. Added /ja/blog, article pages, and /ja/newsletter. Signup stores subscribers only through the server. Public pages show published articles only. Dashboard traffic numbers stay pending until a Vercel read token exists.",
    },
    {
      date: "2026-11-13",
      title: "Private operations dashboard",
      summary:
        "Added /admin/project for allowlisted owners. Revenue reads paid live Stripe Checkout sessions. Customers read live-checkout entitlements. Visitor and page-view numbers stay pending until an analytics read API is added.",
    },
  ],
};

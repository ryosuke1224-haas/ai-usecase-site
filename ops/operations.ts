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
  updated: "2026-11-13",
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
      status: "IN_PROGRESS",
      note: "Private /admin/project is the operating console. Visitor numbers stay pending until a Vercel Web Analytics read token is configured.",
    },
    {
      id: "vercel-analytics",
      name: "Vercel Analytics",
      status: "IN_PROGRESS",
      note: "The analytics package is in the root layout and skips /admin. Collection also needs Web Analytics enabled on the Vercel project. The dashboard cannot read the numbers yet.",
    },
    {
      id: "blog",
      name: "Blog foundation",
      status: "IN_PROGRESS",
      note: "Japanese /ja/blog and article pages are in the app. Only PUBLISHED rows are public. Apply the Atlas Supabase articles migration before drafts can be saved.",
    },
    {
      id: "newsletter-signup",
      name: "Newsletter signup",
      status: "IN_PROGRESS",
      note: "Signup forms are on the Japanese homepage, blog, articles, and /ja/newsletter. Storage starts after the Atlas Supabase migration is applied. Mail is not sent.",
    },
    {
      id: "newsletter-sending",
      name: "Newsletter sending",
      status: "PLANNED",
      note: "Issue drafts can be reviewed. No sending pipeline yet.",
      priority: "medium",
      nextAction: "Keep send disconnected until an approved issue workflow exists.",
    },
    {
      id: "atlas-weekly",
      name: "Atlas weekly",
      status: "PLANNED",
      note: "Full weekly orchestration is not running.",
      priority: "high",
      nextAction: "Insert research, drafts, and QA into the Review Queue.",
    },
    {
      id: "review-queue",
      name: "Review queue",
      status: "IN_PROGRESS",
      note: "The Review Queue can approve, request changes, or reject. It does not publish or send. Decisions are stored after the Atlas review migration is applied. Local Atlas memory stays read-only here.",
    },
    {
      id: "cs-automation",
      name: "CS automation",
      status: "PLANNED",
      note: "Customer-support automation has not been started.",
      priority: "low",
      nextAction: "Leave customer-support drafts for a later phase.",
    },
    {
      id: "sns-automation",
      name: "SNS automation",
      status: "PLANNED",
      note: "Social posting automation has not been started.",
      priority: "low",
      nextAction: "Leave social drafts for a later phase.",
    },
  ],
  roadmap: {
    now: [
      {
        id: "analytics-read",
        name: "Analytics read",
        note: "Read visitors, page views, top pages, and referrers into /admin/project with a server-only Vercel token.",
      },
      {
        id: "content-storage",
        name: "Atlas content storage",
        note: "Apply the articles, newsletter, and review migrations on the Atlas Supabase project.",
      },
    ],
    next: [
      {
        id: "atlas-weekly-automation",
        name: "Atlas Weekly Automation",
        note: "Research, draft blog and newsletter items, generate Blueprint candidates, run QA, and insert the results into the Review Queue.",
      },
    ],
    later: [
      {
        id: "newsletter-sending",
        name: "Automated newsletter sending",
        note: "Send an approved issue to active subscribers.",
      },
      {
        id: "sns-automation",
        name: "SNS automation",
        note: "Draft social posts from an approved issue.",
      },
      {
        id: "cs-automation",
        name: "CS automation",
        note: "Draft support replies for a person to send.",
      },
      {
        id: "atlas-weekly",
        name: "Full Atlas weekly orchestration",
        note: "Research, draft, review, and send on one weekly path.",
      },
    ],
  },
  recentChanges: [
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

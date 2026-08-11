import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/src/lib/auth";
import {
  canAccessBlueprint,
  DAILY_INBOX_STARTER_KIT_PATH,
  getBlueprintById,
  MY_BLUEPRINTS_PATH,
} from "@/src/lib/blueprints";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Daily Inbox Briefing Starter Kit",
  description:
    "Everything you need to run, review, and customize the Daily Inbox Briefing workflow yourself.",
  robots: { index: false, follow: false },
};

const RESOURCES = [
  "Initial Daily Inbox Briefing Prompt",
  "Priority Rules Prompt",
  "ChatGPT Setup Guide",
  "Claude Setup Guide",
  "Gemini Setup Guide",
  "Priority Rules Worksheet",
  "Review Checklist",
  "Safety Guidance",
  "Troubleshooting",
] as const;

export default async function DailyInboxStarterKitPage() {
  const user = await requireUser(DAILY_INBOX_STARTER_KIT_PATH);
  const blueprint = getBlueprintById("daily-inbox-briefing-starter-kit");

  if (!blueprint || !canAccessBlueprint(user.id, blueprint)) {
    // Structured so premium rules can deny access later without a redesign.
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight">Access required</h1>
        <p className="mt-3 text-sm text-muted">
          This Starter Kit is not available for your account yet.
        </p>
        <Link
          href={MY_BLUEPRINTS_PATH}
          className="mt-6 inline-flex text-sm font-medium text-accent hover:underline"
        >
          Back to My Blueprints
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Free Starter Kit
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        AI Daily Inbox Briefing Starter Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Everything you need to run, review, and customize the workflow yourself.
      </p>
      <p className="mt-2 text-xs text-muted">
        Signed in as {user.email ?? "your Atlas account"}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {RESOURCES.map((title) => (
          <div
            key={title}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted">
              Coming next
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              The downloadable content for this resource will be added in the
              next update.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/use-cases/ai-daily-inbox-briefing"
          className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Back to the workflow page
        </Link>
        <Link
          href={MY_BLUEPRINTS_PATH}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          My Blueprints
        </Link>
      </div>
    </div>
  );
}

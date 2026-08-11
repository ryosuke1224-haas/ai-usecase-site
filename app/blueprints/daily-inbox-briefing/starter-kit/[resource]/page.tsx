import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityWorksheet } from "@/components/starter-kit/priority-worksheet";
import { PromptResource } from "@/components/starter-kit/prompt-resource";
import { ResourceShell } from "@/components/starter-kit/resource-shell";
import { ReviewChecklist } from "@/components/starter-kit/review-checklist";
import { SafetyGuidance } from "@/components/starter-kit/safety-guidance";
import { SetupGuide } from "@/components/starter-kit/setup-guide";
import { Troubleshooting } from "@/components/starter-kit/troubleshooting";
import { requireUser } from "@/src/lib/auth";
import {
  canAccessBlueprint,
  getBlueprintById,
  MY_BLUEPRINTS_PATH,
} from "@/src/lib/blueprints";
import {
  getStarterKitResource,
  isStarterKitResourceSlug,
  type StarterKitResourceSlug,
} from "@/src/lib/starter-kit/catalog";
import { getStarterKitDemoTool } from "@/src/lib/starter-kit/demos";
import {
  INITIAL_DAILY_INBOX_BRIEFING_PROMPT,
  PRIORITY_RULES_PROMPT,
} from "@/src/lib/starter-kit/prompts";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ resource: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { resource: slug } = await params;
  const resource = getStarterKitResource(slug);
  if (!resource) {
    return { title: "Starter Kit resource", robots: { index: false, follow: false } };
  }
  return {
    title: resource.title,
    description: resource.summary,
    robots: { index: false, follow: false },
  };
}

const SETUP_COPY: Record<
  "chatgpt-setup" | "claude-setup" | "gemini-setup",
  {
    toolKey: "chatgpt" | "claude" | "gemini";
    accountNeeded: string;
    whereToConnect: string[];
    notes: string[];
  }
> = {
  "chatgpt-setup": {
    toolKey: "chatgpt",
    accountNeeded:
      "A ChatGPT account that supports connectors for Gmail and Google Calendar. Availability may vary by plan.",
    whereToConnect: [
      "Open ChatGPT and go to settings for apps, connectors, or connected apps (wording varies by plan).",
      "Look for Gmail and Google Calendar connectors.",
      "Connect the Google account that holds the inbox and calendar you want to brief.",
      "Return to a new chat and confirm the connector is available before pasting the Starter Kit prompt.",
    ],
    notes: [
      "If a connector is missing, your plan or admin settings may not allow it yet—try again later or use Claude/Gemini from this kit.",
      "After connecting, start with a small test (“list today’s calendar events”) before running the full briefing prompt.",
    ],
  },
  "claude-setup": {
    toolKey: "claude",
    accountNeeded:
      "A Claude account that can use connectors for Gmail and Google Calendar. Free plan support may include usage limits.",
    whereToConnect: [
      "Open Claude and open the connectors / integrations area for your account.",
      "Find Gmail and Google Calendar (or Google Workspace) connectors.",
      "Authorize the Google account you use for work email and calendar.",
      "Start a chat where connectors are enabled, then paste the Initial Daily Inbox Briefing Prompt.",
    ],
    notes: [
      "Review every permission Claude requests before authorizing.",
      "If connectors are unavailable, check plan limits and account settings, or use ChatGPT/Gemini from this kit.",
    ],
  },
  "gemini-setup": {
    toolKey: "gemini",
    accountNeeded:
      "A Google account with access to Gemini, Gmail, and Google Calendar. Availability may depend on account settings.",
    whereToConnect: [
      "Open Gemini while signed into the Google account that owns your Gmail and Calendar.",
      "Enable or confirm access to Gmail and Calendar where Gemini offers Google app connections.",
      "Review the permission prompt carefully before continuing.",
      "Ask Gemini to confirm it can see today’s calendar, then paste the Starter Kit prompt.",
    ],
    notes: [
      "Using the same Google account for Gemini, Gmail, and Calendar usually reduces connection issues.",
      "If a connector is unavailable, check Google account settings or try ChatGPT/Claude from this kit.",
    ],
  },
};

function AccessDenied() {
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

function renderResource(slug: StarterKitResourceSlug) {
  switch (slug) {
    case "initial-prompt":
      return (
        <PromptResource
          prompt={INITIAL_DAILY_INBOX_BRIEFING_PROMPT}
          tips={[
            "Paste into ChatGPT, Claude, or Gemini after Gmail and Calendar are connected.",
            "Ask the model to use only connected sources—no invented deadlines or events.",
            "Review TODAY’S TOP 3 PRIORITIES before taking action.",
          ]}
        />
      );
    case "priority-rules-prompt":
      return (
        <PromptResource
          prompt={PRIORITY_RULES_PROMPT}
          tips={[
            "Run this after an initial briefing to re-rank with the guided-demo rules.",
            "Read the WHAT CHANGED section to learn how the rules affected priorities.",
            "Customize further with the Priority Rules Worksheet when you are ready.",
          ]}
        />
      );
    case "chatgpt-setup":
    case "claude-setup":
    case "gemini-setup": {
      const copy = SETUP_COPY[slug];
      const tool = getStarterKitDemoTool(copy.toolKey);
      return (
        <SetupGuide
          tool={tool}
          accountNeeded={copy.accountNeeded}
          whereToConnect={copy.whereToConnect}
          notes={copy.notes}
        />
      );
    }
    case "priority-worksheet":
      return <PriorityWorksheet />;
    case "review-checklist":
      return <ReviewChecklist />;
    case "safety-guidance":
      return <SafetyGuidance />;
    case "troubleshooting":
      return <Troubleshooting />;
    default:
      return null;
  }
}

export default async function StarterKitResourcePage({ params }: PageProps) {
  const { resource: slug } = await params;
  if (!isStarterKitResourceSlug(slug)) {
    notFound();
  }

  const resource = getStarterKitResource(slug);
  if (!resource) {
    notFound();
  }

  const user = await requireUser(resource.href);
  const blueprint = getBlueprintById("daily-inbox-briefing-starter-kit");
  if (!blueprint || !canAccessBlueprint(user.id, blueprint)) {
    return <AccessDenied />;
  }

  return (
    <ResourceShell title={resource.title} summary={resource.summary}>
      {renderResource(slug)}
    </ResourceShell>
  );
}

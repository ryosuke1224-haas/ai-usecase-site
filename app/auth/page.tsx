import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/src/lib/auth";
import {
  DAILY_INBOX_STARTER_KIT_PATH,
  MY_BLUEPRINTS_PATH,
  sanitizeNextPath,
} from "@/src/lib/blueprints";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to AI Use Case Atlas to access your saved Blueprints and Starter Kits.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

function authCopyForDestination(nextPath: string) {
  const isStarterKit =
    nextPath === DAILY_INBOX_STARTER_KIT_PATH ||
    nextPath.startsWith(`${DAILY_INBOX_STARTER_KIT_PATH}?`) ||
    nextPath.startsWith(`${DAILY_INBOX_STARTER_KIT_PATH}/`);

  if (isStarterKit) {
    return {
      eyebrow: "Free Atlas account",
      heading: "Get your free Starter Kit",
      description:
        "Create a free Atlas account to access the Daily Inbox Briefing Starter Kit and save it to My Blueprints.",
    };
  }

  return {
    eyebrow: "Atlas account",
    heading: "Sign in to AI Use Case Atlas",
    description:
      "Enter your email to access your saved Blueprints and Starter Kits.",
  };
}

export default async function AuthPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Preserve an explicit `next` destination. Bare /auth defaults to My Blueprints
  // so generic sign-in is not framed as the Starter Kit offer.
  const nextPath = sanitizeNextPath(params.next, MY_BLUEPRINTS_PATH);
  const copy = authCopyForDestination(nextPath);

  const user = await getCurrentUser();
  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12 sm:py-16">
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {copy.heading}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {copy.description}
        </p>

        {params.error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
          >
            That sign-in link is invalid or has expired. Enter your email to
            receive a new one.
          </p>
        )}

        <div className="mt-6">
          <AuthForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}

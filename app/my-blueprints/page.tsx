import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/src/lib/auth";
import {
  listUnlockedBlueprints,
  MY_BLUEPRINTS_PATH,
} from "@/src/lib/blueprints";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Blueprints",
  description: "Access your unlocked Atlas blueprints and starter kits.",
  robots: { index: false, follow: false },
};

export default async function MyBlueprintsPage() {
  const user = await requireUser(MY_BLUEPRINTS_PATH);
  const unlocked = listUnlockedBlueprints(user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        My Blueprints
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Return anytime to open the free and purchased blueprints unlocked for
        your Atlas account.
      </p>
      <p className="mt-2 text-xs text-muted">
        Signed in as {user.email ?? "your Atlas account"}
      </p>

      <ul className="mt-8 space-y-3">
        {unlocked.map((blueprint) => (
          <li
            key={blueprint.id}
            className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                {blueprint.badge}
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Unlocked
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
              {blueprint.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {blueprint.summary}
            </p>
            <div className="mt-4">
              <Link
                href={blueprint.href}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Open Starter Kit
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {unlocked.length === 0 && (
        <p className="mt-8 rounded-xl border border-border/60 bg-surface/60 px-5 py-4 text-sm text-muted">
          No blueprints are unlocked yet.
        </p>
      )}
    </div>
  );
}

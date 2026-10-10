import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/src/lib/auth";
import { MY_BLUEPRINTS_PATH } from "@/src/lib/blueprints";
import { listBlueprintCards, type BlueprintCard } from "@/src/lib/payments/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Blueprints",
  description: "Access your unlocked Atlas blueprints and starter kits.",
  robots: { index: false, follow: false },
};

function cardAction(blueprint: BlueprintCard): { href: string; label: string } {
  if (blueprint.unlocked && blueprint.access === "free-authenticated") {
    return { href: blueprint.href, label: "Open Starter Kit" };
  }
  if (blueprint.unlocked) {
    return { href: blueprint.href, label: "Open Blueprint" };
  }
  return {
    href: blueprint.purchaseHref ?? MY_BLUEPRINTS_PATH,
    label: "Available to purchase",
  };
}

export default async function MyBlueprintsPage() {
  const user = await requireUser(MY_BLUEPRINTS_PATH);
  const blueprints = await listBlueprintCards(user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        My Blueprints
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Free Starter Kits stay unlocked. Paid blueprints stay locked until a
        confirmed payment is recorded for your account.
      </p>
      <p className="mt-2 text-xs text-muted">
        Signed in as {user.email ?? "your Atlas account"}
      </p>

      <ul className="mt-8 space-y-3">
        {blueprints.map((blueprint) => {
          const action = cardAction(blueprint);
          return (
            <li
              key={blueprint.id}
              className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                  {blueprint.badge}
                </span>
                <span
                  className={
                    blueprint.unlocked
                      ? "inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                      : "inline-flex items-center rounded-md bg-surface px-2.5 py-0.5 text-xs font-medium text-muted"
                  }
                >
                  {blueprint.unlocked ? "Unlocked" : "Locked"}
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
                  href={action.href}
                  className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {action.label}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {blueprints.length === 0 && (
        <p className="mt-8 rounded-xl border border-border/60 bg-surface/60 px-5 py-4 text-sm text-muted">
          No blueprints are unlocked yet.
        </p>
      )}
    </div>
  );
}

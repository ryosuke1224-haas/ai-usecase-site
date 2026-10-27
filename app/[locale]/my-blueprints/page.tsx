import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { collectionsPaths, isUiLocale, localizedHref } from "@/src/lib/i18n/locale";
import { listBlueprintCards, type BlueprintCard } from "@/src/lib/payments/access";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return { title: siteCopy(locale).blueprints.title, robots: { index: false, follow: false } };
}

function cardAction(blueprint: BlueprintCard, locale: "ja" | "en"): { href: string; label: string } {
  const copy = siteCopy(locale).blueprints;
  const paths = collectionsPaths(locale);
  if (blueprint.unlocked && blueprint.access === "free-authenticated") {
    return {
      href: locale === "ja" ? "/ja/use-cases/ai-daily-inbox-briefing" : blueprint.href,
      label: copy.openStarter,
    };
  }
  if (blueprint.unlocked) return { href: paths.kit, label: copy.openBlueprint };
  return { href: paths.demo, label: copy.purchase };
}

export default async function LocaleMyBlueprintsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const destination = localizedHref(locale, "/my-blueprints");
  const user = await getCurrentUser();
  if (!user) redirect(authPath(destination, locale));
  const blueprints = await listBlueprintCards(user.id);
  const copy = siteCopy(locale).blueprints;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
      <p className="mt-2 text-sm text-muted">{copy.freeNote}</p>
      <p className="mt-2 text-xs text-muted">{copy.signedIn(user.email ?? "Atlas")}</p>
      <ul className="mt-8 space-y-3">
        {blueprints.map((blueprint) => {
          const action = cardAction(blueprint, locale);
          return (
            <li key={blueprint.id} className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
                  {locale === "ja" ? (blueprint.access === "free-authenticated" ? "無料" : "プレミアム") : blueprint.badge}
                </span>
                <span className={blueprint.unlocked ? "inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400" : "inline-flex items-center rounded-md bg-surface px-2.5 py-0.5 text-xs font-medium text-muted"}>
                  {blueprint.unlocked ? copy.unlocked : copy.locked}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">{blueprint.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {locale === "ja" && blueprint.id === "daily-inbox-briefing-starter-kit"
                  ? "受信メールを短く整理する無料テンプレートです。"
                  : locale === "ja" && blueprint.id === "ai-collections-assistant"
                    ? "遅れている入金を週ごとに確認し、送る文面は自分で決めるテンプレートです。"
                    : blueprint.summary}
              </p>
              <div className="mt-4">
                <Link href={action.href} className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">
                  {action.label}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

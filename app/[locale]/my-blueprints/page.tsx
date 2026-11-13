import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { collectionsPaths, isUiLocale, localizedHref, noShowPaths } from "@/src/lib/i18n/locale";
import { listBlueprintCards, type BlueprintCard } from "@/src/lib/payments/access";

const JAPANESE_LAUNCH_IDS = new Set([
  "ai-customer-response-assistant",
  "ai-expense-watchdog",
  "ai-payroll-forecasting",
  "ai-pipeline-risk-detector",
  "ai-proposal-follow-up-assistant",
  "ai-staffing-optimizer",
  "google-ads-performance-coach",
  "inactive-customer-winback",
  "no-show-recovery-assistant",
  "quote-request-assistant",
  "unbilled-work-review-queue",
]);

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return { title: siteCopy(locale).blueprints.title, robots: { index: false, follow: false } };
}

function cardAction(blueprint: BlueprintCard, locale: "ja" | "en"): { href: string; label: string } {
  const copy = siteCopy(locale).blueprints;
  if (blueprint.unlocked && blueprint.access === "free-authenticated") {
    return {
      href: locale === "ja" ? "/ja/use-cases/ai-daily-inbox-briefing" : blueprint.href,
      label: copy.openStarter,
    };
  }
  if (locale === "ja" && JAPANESE_LAUNCH_IDS.has(blueprint.id)) {
    const demo = `/ja/blueprints/${blueprint.id}`;
    if (blueprint.unlocked) return { href: `${demo}/kit`, label: copy.openBlueprint };
    return { href: demo, label: copy.purchase };
  }
  if (blueprint.id === "no-show-recovery-assistant") {
    const paths = noShowPaths(locale);
    if (blueprint.unlocked) return { href: paths.kit, label: copy.openBlueprint };
    return { href: paths.demo, label: "Private preview" };
  }
  const paths = collectionsPaths(locale);
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
    <div className="launch-canvas mx-auto max-w-4xl px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
      <p className="mt-2 text-sm text-muted">{copy.freeNote}</p>
      <p className="mt-2 text-xs text-muted">{copy.signedIn(user.email ?? "Atlas")}</p>
      <ul className="mt-8 space-y-4">
        {blueprints.map((blueprint) => {
          const action = cardAction(blueprint, locale);
          return (
            <li
              key={blueprint.id}
              className={`rounded-2xl border bg-card p-5 shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_5%,transparent)] sm:p-6 ${
                blueprint.unlocked ? "border-emerald-600/35" : "border-border/80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
                  {locale === "ja" ? (blueprint.access === "free-authenticated" ? "無料" : "プレミアム") : blueprint.badge}
                </span>
                <span className={blueprint.unlocked ? "inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400" : "inline-flex items-center rounded-md bg-surface px-2.5 py-0.5 text-xs font-medium text-muted"}>
                  {blueprint.unlocked ? copy.unlocked : copy.locked}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                {locale === "ja" && (JAPANESE_LAUNCH_IDS.has(blueprint.id) || blueprint.id === "ai-collections-assistant")
                  ? japaneseUseCase(blueprint.id)?.title ?? blueprint.title
                  : blueprint.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {locale === "ja" && blueprint.id === "daily-inbox-briefing-starter-kit"
                  ? "受信メールを短く整理する無料テンプレートです。"
                  : locale === "ja" && blueprint.id === "ai-collections-assistant"
                    ? "遅れている入金を週ごとに確認し、送る文面は自分で決めるテンプレートです。"
                    : locale === "ja" && JAPANESE_LAUNCH_IDS.has(blueprint.id)
                      ? japaneseUseCase(blueprint.id)?.summary ?? blueprint.summary
                      : blueprint.summary}
              </p>
              <div className="mt-5">
                <Link href={action.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto">
                  {action.label}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {blueprints.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border/80 bg-card px-5 py-8 text-sm text-muted">
          {copy.empty}
        </p>
      ) : null}
    </div>
  );
}

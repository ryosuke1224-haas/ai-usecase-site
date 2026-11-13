import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { FactLabel } from "./fact-label";
import { LaunchPurchasePanel } from "@/components/premium/shared/launch-purchase-panel";
import { GuidedDemo } from "./guided-demo";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12";

export function NoShowPublicView({
  locale,
  pathLocale,
  checkoutUnavailable = false,
}: {
  locale: UiLocale;
  pathLocale: UiLocale | null;
  checkoutUnavailable?: boolean;
}) {
  const copy = noShowCopy(locale);
  return (
    <div className={PAGE}>
      <p
        className={`inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent ${locale === "ja" ? "" : "uppercase tracking-wider"}`}
      >
        {copy.publicEyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{copy.publicTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.publicBody}</p>
      <ul aria-label={copy.labelsTitle} className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground">
        <li>
          <FactLabel kind="CONFIRMED" label={locale === "ja" ? "確認済み" : undefined} /> {copy.confirmedHelp}
        </li>
        <li>
          <FactLabel kind="NEEDS YOUR CHECK" label={locale === "ja" ? "要確認" : undefined} /> {copy.needsCheckHelp}
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" label={locale === "ja" ? "AIの解釈" : undefined} /> {copy.interpretationHelp}
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" label={locale === "ja" ? "推奨アクション" : undefined} /> {copy.recommendedHelp}
        </li>
      </ul>
      <p
        role="note"
        className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200"
      >
        {copy.fictionalNotice}
      </p>
      <div className="mt-6">
        <LaunchPurchasePanel slug="no-show-recovery-assistant" uiLocale={locale} checkoutUnavailable={checkoutUnavailable} />
        <GuidedDemo locale={locale} pathLocale={pathLocale} />
      </div>
    </div>
  );
}

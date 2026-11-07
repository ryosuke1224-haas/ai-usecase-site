import type { UiLocale } from "@/src/lib/i18n/locale";

export type FactKind =
  | "CONFIRMED"
  | "NEEDS YOUR CHECK"
  | "AI INTERPRETATION"
  | "RECOMMENDED ACTION"
  | "SKIPPED"
  | "YOU DECIDE";

const KIND_STYLES: Record<FactKind, string> = {
  CONFIRMED: "border-emerald-600/50 text-emerald-800 dark:text-emerald-300",
  "NEEDS YOUR CHECK": "border-orange-600/50 text-orange-800 dark:text-orange-300",
  "AI INTERPRETATION": "border-amber-600/50 text-amber-800 dark:text-amber-300",
  "RECOMMENDED ACTION": "border-indigo-600/50 text-indigo-800 dark:text-indigo-300",
  SKIPPED: "border-slate-500/50 text-slate-700 dark:text-slate-300",
  "YOU DECIDE": "border-sky-600/50 text-sky-800 dark:text-sky-300",
};

const KIND_LABELS: Record<UiLocale, Record<FactKind, string>> = {
  en: {
    CONFIRMED: "CONFIRMED",
    "NEEDS YOUR CHECK": "NEEDS YOUR CHECK",
    "AI INTERPRETATION": "AI INTERPRETATION",
    "RECOMMENDED ACTION": "RECOMMENDED ACTION",
    SKIPPED: "SKIPPED",
    "YOU DECIDE": "YOU DECIDE",
  },
  ja: {
    CONFIRMED: "確認済み",
    "NEEDS YOUR CHECK": "要確認",
    "AI INTERPRETATION": "AIの解釈",
    "RECOMMENDED ACTION": "推奨アクション",
    SKIPPED: "対象外",
    "YOU DECIDE": "人が決める",
  },
};

/** The label word itself carries the meaning; color is only a secondary cue. */
export function FactLabel({ kind, locale = "en" }: { kind: FactKind; locale?: UiLocale }) {
  return (
    <span
      className={`mr-1.5 inline-block rounded border px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider ${KIND_STYLES[kind]}`}
    >
      {KIND_LABELS[locale][kind]}
    </span>
  );
}

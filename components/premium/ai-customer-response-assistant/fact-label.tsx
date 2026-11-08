export type FactKind =
  | "CONFIRMED"
  | "AI INTERPRETATION"
  | "RECOMMENDED ACTION"
  | "NEEDS YOUR CHECK"
  | "ESCALATE"
  | "FAQ FACT"
  | "INTERNAL NOTE"
  | "PARTIAL DRAFT";

const KIND_STYLES: Record<FactKind, string> = {
  CONFIRMED: "border-emerald-600/50 text-emerald-800 dark:text-emerald-300",
  "AI INTERPRETATION": "border-amber-600/50 text-amber-800 dark:text-amber-300",
  "RECOMMENDED ACTION": "border-indigo-600/50 text-indigo-800 dark:text-indigo-300",
  "NEEDS YOUR CHECK": "border-orange-600/50 text-orange-800 dark:text-orange-300",
  ESCALATE: "border-rose-600/50 text-rose-800 dark:text-rose-300",
  "FAQ FACT": "border-sky-600/50 text-sky-800 dark:text-sky-300",
  "INTERNAL NOTE": "border-slate-500/50 text-slate-700 dark:text-slate-300",
  "PARTIAL DRAFT": "border-teal-600/50 text-teal-800 dark:text-teal-300",
};

/** The label word itself carries the meaning; color is only a secondary cue. */
export function FactLabel({ kind }: { kind: FactKind }) {
  return (
    <span
      className={`mr-1.5 inline-block rounded border px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider ${KIND_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}

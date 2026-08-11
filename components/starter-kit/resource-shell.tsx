import Link from "next/link";
import { DAILY_INBOX_STARTER_KIT_PATH } from "@/src/lib/blueprints";

type ResourceShellProps = {
  title: string;
  summary: string;
  children: React.ReactNode;
};

export function ResourceShell({ title, summary, children }: ResourceShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
      <Link
        href={DAILY_INBOX_STARTER_KIT_PATH}
        className="text-xs font-medium text-muted hover:text-accent"
      >
        ← Back to Starter Kit
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Ready
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        {summary}
      </p>

      <div className="mt-8">{children}</div>
    </div>
  );
}

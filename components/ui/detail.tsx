import type { ReactNode } from "react";

export function DetailSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "info";
}) {
  const styles = {
    default: "bg-surface text-muted",
    accent: "bg-accent/15 text-accent",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    info: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item}>{item}</Badge>
      ))}
    </div>
  );
}

export function SlugLinkList({
  slugs,
  basePath,
  resolveName,
}: {
  slugs: string[];
  basePath: string;
  resolveName: (slug: string) => string;
}) {
  return (
    <ul className="space-y-2">
      {slugs.map((slug) => (
        <li key={slug}>
          <a
            href={`${basePath}/${slug}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            {resolveName(slug)}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={item} className="flex gap-3 text-sm text-muted">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-surface">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-semibold text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/40 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-surface text-muted hover:bg-border/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

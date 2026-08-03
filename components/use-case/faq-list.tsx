/**
 * Accessible FAQ built on native disclosure elements, matching the existing
 * "Technical details" pattern on use-case pages. Works without JavaScript and
 * needs no client bundle.
 */
export function FaqList({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-surface/40">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            <span className="text-sm font-medium text-foreground">
              {item.question}
            </span>
            <span
              className="shrink-0 text-muted transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              &#9662;
            </span>
          </summary>
          <p className="px-5 pb-4 text-sm leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

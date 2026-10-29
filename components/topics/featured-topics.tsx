import Link from "next/link";
import type { UiLocale } from "@/src/lib/i18n/locale";
import type { FeaturedTopicCard } from "@/src/lib/topics";

export function FeaturedTopics({
  locale,
  topics,
}: {
  locale: UiLocale;
  topics: FeaturedTopicCard[];
}) {
  if (topics.length === 0) return null;
  const heading = locale === "ja" ? "注目テーマ" : "Featured topics";

  return (
    <section id="featured-topics" className="mt-16 scroll-mt-24 sm:mt-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h2>
      <ul className="mt-8 grid gap-4">
        {topics.map((topic) => (
          <li key={topic.slug}>
            <article className="rounded-xl border border-border/60 bg-card px-6 py-6 sm:px-8">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">{topic.eyebrow}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{topic.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{topic.body}</p>
              <Link
                href={topic.href}
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                {topic.cta}
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

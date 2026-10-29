import type { UiLocale } from "@/src/lib/i18n/locale";
import { topicStatusLabel, type Topic } from "@/src/lib/topics";

export function TopicPageView({ locale, topic }: { locale: UiLocale; topic: Topic }) {
  const kindLabel = locale === "ja" ? { free: "無料", premium: "有料" } : { free: "Free", premium: "Premium" };

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{topic.headline[locale]}</h1>
      <p className="mt-5 text-base leading-relaxed text-muted">{topic.purpose[locale]}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{topic.checksTitle[locale]}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {topic.checks[locale].map((item) => (
            <li key={item} className="rounded-lg border border-border/60 bg-surface/60 px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{topic.excludedTitle[locale]}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          {topic.excluded[locale].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{topic.plannedTitle[locale]}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{topic.plannedNote[locale]}</p>
        <ul className="mt-4 space-y-3">
          {topic.offerings.map((offering) => (
            <li key={offering.id} className="rounded-xl border border-border/60 bg-card px-5 py-4">
              <p className="text-xs font-medium text-muted">{kindLabel[offering.kind]}</p>
              <h3 className="mt-1 text-base font-semibold">{offering.name[locale]}</h3>
              <p className="mt-2 text-sm text-muted">{topicStatusLabel[offering.status][locale]}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

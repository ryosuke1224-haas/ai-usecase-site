import Link from "next/link";
import type { UseCaseExperience } from "@/src/types";
import { getOfferDestination } from "@/src/lib/offers";
import { ExperienceSection } from "./experience-sections";

type Offers = UseCaseExperience["offers"];
type Offer = Offers["items"][number];

function OfferCard({ offer }: { offer: Offer }) {
  const destination = getOfferDestination(offer.key);
  const isPrimary = offer.primary === true;
  // While no real destination is configured the CTA must not imply checkout.
  const ctaLabel = destination.isFallback
    ? (offer.previewCtaLabel ?? offer.ctaLabel)
    : offer.ctaLabel;

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-card p-6 ${
        isPrimary ? "border-accent/50 shadow-sm" : "border-border/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {offer.label}
        </p>
        {offer.badge && (
          <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
            {offer.badge}
          </span>
        )}
      </div>

      <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        {offer.name}
      </h3>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {offer.price}
      </p>
      {offer.status && (
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
          {offer.status}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {offer.description}
      </p>
      {offer.bestFor && (
        <p className="mt-2 text-xs font-medium text-foreground">
          {offer.bestFor}
        </p>
      )}

      <ul className="mt-4 flex-1 space-y-2">
        {offer.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <span aria-hidden="true" className="mt-0.5 text-accent">
              &#10003;
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {offer.note && (
        <p className="mt-4 text-xs leading-relaxed text-muted">{offer.note}</p>
      )}

      <div className="mt-5">
        <Link
          href={destination.href}
          className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
            isPrimary
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "border border-border/60 bg-surface text-foreground hover:border-accent/40 hover:bg-card"
          }`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export function OfferComparison({ offers }: { offers: Offers }) {
  const anyFallback = offers.items.some(
    (offer) => getOfferDestination(offer.key).isFallback,
  );

  return (
    <ExperienceSection id="offers" heading={offers.heading}>
      <div className="grid gap-4 lg:grid-cols-3">
        {offers.items.map((offer) => (
          <OfferCard key={offer.key} offer={offer} />
        ))}
      </div>
      {anyFallback && (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <span className="font-medium text-foreground">
            None of these are available to buy yet.
          </span>{" "}
          Prices show what each option is planned to cost. Every button opens
          the contact page, where you can register interest and be told when it
          is ready — no payment is taken.
        </p>
      )}
    </ExperienceSection>
  );
}

export function FinalPurchaseCta({
  finalCta,
}: {
  finalCta: UseCaseExperience["finalCta"];
}) {
  const destination = getOfferDestination("manual");

  return (
    <section
      id="get-started"
      className="scroll-mt-24 rounded-2xl border border-border/60 bg-card p-6 text-center sm:p-10"
    >
      <h2 className="mx-auto max-w-2xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {finalCta.headline}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {finalCta.description}
      </p>
      <div className="mt-6">
        <Link
          href={destination.href}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {finalCta.primaryLabel}
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted">{finalCta.supporting}</p>
      {destination.isFallback && (
        <p className="mt-1 text-xs text-muted">
          Checkout is not live yet — this opens the contact page.
        </p>
      )}
    </section>
  );
}

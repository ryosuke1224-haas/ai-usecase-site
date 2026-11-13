import Link from "next/link";
import { isLaunchProduct } from "@/src/lib/payments/launch-catalog";
import { FOCUS_RING } from "./styles";

type PremiumKitLockedCopy = {
  eyebrow: string;
  title: string;
  body: string;
  back: string;
};

function withPurchaseWording(body: string, purchasable: boolean): string {
  if (!purchasable) return body;
  return body
    .replace("There is currently no checkout. ", "One-time purchase is on the guided demo. ")
    .replace("いま購入手続きはありません。", "買い切りの購入はガイドから始めます。");
}

type PremiumKitLockedProps = {
  demoPath: string;
  /** Canonical product slug. Launch products point back to the one-time purchase. */
  productSlug?: string;
  /** Optional product-specific closing sentence after the shared access wording. */
  note?: string;
  className?: string;
  linkClassName?: string;
  /** Localized locked-state copy. English private-preview wording stays the default. */
  copy?: PremiumKitLockedCopy;
};

/**
 * Locked Premium kit gate for private-preview products without checkout.
 * Auth and entitlement checks stay in the page; this only renders the locked UI.
 */
export function PremiumKitLocked({
  demoPath,
  productSlug,
  note,
  className = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-12",
  linkClassName = FOCUS_RING,
  copy,
}: PremiumKitLockedProps) {
  const eyebrow = copy?.eyebrow ?? "Premium · Private preview";
  const title = copy?.title ?? "Premium is locked";
  const back = copy?.back ?? "Back to the guided demo";
  const purchasable = productSlug ? isLaunchProduct(productSlug) : false;
  return (
    <div className={className}>
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {copy ? (
          withPurchaseWording(copy.body, purchasable)
        ) : purchasable ? (
          <>
            Your Atlas account is signed in. This Premium kit is a private preview.
            One-time purchase is on the guided demo. Access is granted by entitlement
            for this private preview. Atlas has not recorded an entitlement for this
            account, so the kit stays closed.
            {note ? ` ${note}` : null}
          </>
        ) : (
          <>
            Your Atlas account is signed in. This Premium kit is a private preview.
            There is currently no checkout. Access is granted by entitlement for this
            private preview. Atlas has not recorded an entitlement for this account,
            so the kit stays closed.
            {note ? ` ${note}` : null}
          </>
        )}
      </p>
      <Link
        href={demoPath}
        className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${linkClassName}`}
      >
        {back}
      </Link>
    </div>
  );
}

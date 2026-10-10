import type { Metadata } from "next";
import Link from "next/link";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/premium/ai-collections-assistant/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import {
  COLLECTIONS_KIT_PATH,
  COLLECTIONS_PRODUCT_SLUG,
  COLLECTIONS_SUCCESS_PATH,
} from "@/src/lib/payments/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment received",
  description: "Atlas is confirming access to your Premium Blueprint.",
  robots: { index: false, follow: false },
  alternates: { canonical: COLLECTIONS_SUCCESS_PATH },
};

/**
 * Re-reads the entitlement. This page never writes access.
 * The session_id query string from Stripe is ignored.
 */
export default async function CheckoutSuccessPage() {
  const user = await requireUser(COLLECTIONS_SUCCESS_PATH);
  const entitled = await hasActiveEntitlement(user.id, COLLECTIONS_PRODUCT_SLUG);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Payment received.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {"We're confirming access to your Premium Blueprint."}
      </p>
      {entitled ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">Access is confirmed.</p>
          <Link href={COLLECTIONS_KIT_PATH} className={`mt-4 ${PRIMARY_BUTTON}`}>
            Open Blueprint
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">
            Access is not confirmed yet. This page does not unlock the Blueprint.
          </p>
          <Link href={COLLECTIONS_SUCCESS_PATH} className={`mt-4 ${SECONDARY_BUTTON}`}>
            Check again
          </Link>
        </div>
      )}
    </div>
  );
}
